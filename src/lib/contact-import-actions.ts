"use server";

import { revalidatePath } from "next/cache";
import { db } from "./db";
import { parseContactWorkbook, type ParsedContactRow } from "./excel";
import { requireUser } from "./session";

export type ContactImportState = {
  error?: string;
  rows?: ParsedContactRow[];
  done?: { created: number; cards: number; newOrgs: number; skipped: number };
};

async function loadIndex() {
  const [organizations, existingContacts] = await Promise.all([
    db.organization.findMany({ select: { id: true, name: true, shortName: true } }),
    db.contact.findMany({ select: { organizationId: true, name: true } }),
  ]);
  return { organizations, existingContacts };
}

export async function previewContactImport(
  _prev: ContactImportState,
  fd: FormData,
): Promise<ContactImportState> {
  await requireUser();

  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "엑셀 파일을 선택해 주세요." };
  }
  if (!/\.xlsx$/i.test(file.name)) {
    return {
      error:
        "xlsx 파일만 읽을 수 있습니다. 리멤버에서 내려받은 파일이 xls 나 csv 라면 엑셀에서 열어 '.xlsx' 로 저장해 주세요.",
    };
  }
  if (file.size > 5 * 1024 * 1024) return { error: "파일이 너무 큽니다 (5MB 이하)." };

  const { organizations, existingContacts } = await loadIndex();

  try {
    const rows = await parseContactWorkbook(
      await file.arrayBuffer(),
      organizations,
      existingContacts,
    );
    if (rows.length === 0) return { error: "읽을 수 있는 데이터가 없습니다." };
    return { rows };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "파일을 읽지 못했습니다." };
  }
}

/**
 * 담당자를 등록하고, 명함 이력도 한 장 함께 남긴다.
 *
 * 명함 앱에서 받은 파일이므로 "그 시점의 명함"이라는 사실이 그대로 기록돼야
 * 나중에 승진·이직을 추적할 수 있다.
 */
export async function commitContactImport(
  _prev: ContactImportState,
  fd: FormData,
): Promise<ContactImportState> {
  await requireUser();

  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "파일이 없습니다. 다시 올려 주세요." };
  }

  /** 등록되지 않은 회사를 만났을 때 */
  const onMissingOrg = String(fd.get("onMissingOrg") ?? "create");
  const { organizations, existingContacts } = await loadIndex();

  let rows: ParsedContactRow[];
  try {
    rows = await parseContactWorkbook(
      await file.arrayBuffer(),
      organizations,
      existingContacts,
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : "파일을 읽지 못했습니다." };
  }

  let created = 0;
  let cards = 0;
  let newOrgs = 0;
  let skipped = 0;

  // 같은 회사가 파일에 여러 번 나와도 고객사는 한 번만 만든다
  const orgCache = new Map<string, string>();

  for (const row of rows) {
    if (row.errors.length > 0 || row.duplicateOf) {
      skipped += 1;
      continue;
    }

    const companyName = String(row.values.companyName);
    let orgId = row.matchedOrgId ?? orgCache.get(companyName) ?? null;

    if (!orgId) {
      if (onMissingOrg === "skip") {
        skipped += 1;
        continue;
      }
      try {
        const org = await db.organization.create({
          data: { name: companyName, status: "잠재고객" },
        });
        orgId = org.id;
        orgCache.set(companyName, org.id);
        newOrgs += 1;
      } catch {
        skipped += 1;
        continue;
      }
    }

    const receivedAt = row.values.receivedAt
      ? new Date(String(row.values.receivedAt))
      : new Date();

    /*
     * 명함첩·그룹은 따로 저장할 자리가 없지만 버리기엔 아깝다.
     * 어느 명함첩에서 온 사람인지가 나중에 맥락이 되므로 메모에 붙여 둔다.
     */
    const memo =
      [
        row.values.memo as string | null,
        row.values.cardBook ? `명함첩: ${row.values.cardBook}` : null,
      ]
        .filter(Boolean)
        .join("\n") || null;

    try {
      const contact = await db.contact.create({
        data: {
          organizationId: orgId,
          name: String(row.values.name),
          department: (row.values.department as string) ?? null,
          position: (row.values.position as string) ?? null,
          email: (row.values.email as string) ?? null,
          phone: (row.values.phone as string) ?? null,
          mobile: (row.values.mobile as string) ?? null,
          memo,
          firstMetAt: receivedAt,
          firstMetChannel: "기타",
          firstMetPlace: "명함 일괄 등록",
        },
      });
      created += 1;

      // 명함 이력도 함께 — 그 시점의 소속·직함을 보존한다
      await db.businessCard.create({
        data: {
          contactId: contact.id,
          receivedAt,
          companyName,
          department: (row.values.department as string) ?? null,
          position: (row.values.position as string) ?? null,
          email: (row.values.email as string) ?? null,
          phone: (row.values.phone as string) ?? null,
          mobile: (row.values.mobile as string) ?? null,
          address: (row.values.address as string) ?? null,
          receivedChannel: "기타",
          memo,
        },
      });
      cards += 1;
    } catch {
      skipped += 1;
    }
  }

  revalidatePath("/contacts");
  revalidatePath("/organizations");
  return { done: { created, cards, newOrgs, skipped } };
}
