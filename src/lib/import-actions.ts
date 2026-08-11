"use server";

import { revalidatePath } from "next/cache";
import { db } from "./db";
import { parseWorkbook, type ParsedRow } from "./excel";
import { requireUser } from "./session";

export type ImportState = {
  error?: string;
  rows?: ParsedRow[];
  /** 미리보기용으로 브라우저에 잠시 들고 있을 파일 이름 */
  fileName?: string;
  /** 실제로 저장한 뒤의 결과 */
  done?: { created: number; skipped: number };
};

/**
 * 업로드된 파일을 읽어 행별 검증 결과만 돌려준다. 아직 저장하지 않는다.
 *
 * 바로 넣어 버리면 잘못된 파일 하나로 DB 가 엉킨다.
 * 사람이 눈으로 확인하고 등록 버튼을 한 번 더 누르게 한다.
 */
export async function previewImport(
  _prev: ImportState,
  fd: FormData,
): Promise<ImportState> {
  await requireUser();

  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "엑셀 파일을 선택해 주세요." };
  }
  if (!/\.xlsx$/i.test(file.name)) {
    return {
      error:
        "xlsx 파일만 읽을 수 있습니다. 엑셀에서 '다른 이름으로 저장 → Excel 통합 문서(.xlsx)' 로 저장해 주세요.",
    };
  }
  // 사내에서 쓰는 명단이 수만 줄이 될 일은 없다. 실수로 큰 파일을 올렸을 때를 막는다.
  if (file.size > 5 * 1024 * 1024) {
    return { error: "파일이 너무 큽니다 (5MB 이하)." };
  }

  const existing = await db.organization.findMany({
    select: { name: true, bizRegNo: true },
  });

  try {
    const rows = await parseWorkbook(await file.arrayBuffer(), existing);
    if (rows.length === 0) {
      return { error: "읽을 수 있는 데이터가 없습니다. 내용이 비어 있는지 확인해 주세요." };
    }
    return { rows, fileName: file.name };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "파일을 읽지 못했습니다." };
  }
}

/**
 * 확인을 마친 행들을 실제로 저장한다.
 * 미리보기에서 넘어온 값을 그대로 쓰지 않고 파일을 다시 읽어 검증한다.
 */
export async function commitImport(
  _prev: ImportState,
  fd: FormData,
): Promise<ImportState> {
  await requireUser();

  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "파일이 없습니다. 다시 올려 주세요." };
  }

  /** 이미 등록된 고객사와 겹칠 때 어떻게 할지 */
  const onDuplicate = String(fd.get("onDuplicate") ?? "skip");

  const existing = await db.organization.findMany({
    select: { id: true, name: true, bizRegNo: true },
  });

  let rows: ParsedRow[];
  try {
    rows = await parseWorkbook(await file.arrayBuffer(), existing);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "파일을 읽지 못했습니다." };
  }

  let created = 0;
  let skipped = 0;

  for (const row of rows) {
    if (row.errors.length > 0) {
      skipped += 1;
      continue;
    }
    if (row.duplicateOf && onDuplicate === "skip") {
      skipped += 1;
      continue;
    }

    const data = {
      name: String(row.values.name),
      shortName: (row.values.shortName as string) ?? null,
      bizRegNo: (row.values.bizRegNo as string) ?? null,
      orgType: (row.values.orgType as string) ?? "기업",
      industry: (row.values.industry as string) ?? null,
      sizeTier: (row.values.sizeTier as string) ?? null,
      employeeCount: (row.values.employeeCount as number) ?? null,
      status: (row.values.status as string) ?? "잠재고객",
      acquisitionChannel: (row.values.acquisitionChannel as string) ?? null,
      clientDepartment: (row.values.clientDepartment as string) ?? null,
      departmentRole: (row.values.departmentRole as string) ?? null,
      ownerName: (row.values.ownerName as string) ?? null,
      phone: (row.values.phone as string) ?? null,
      website: (row.values.website as string) ?? null,
      address: (row.values.address as string) ?? null,
      memo: (row.values.memo as string) ?? null,
    };

    try {
      if (row.duplicateOf && onDuplicate === "update") {
        // 사업자등록번호를 먼저, 없으면 이름으로 찾는다
        const target =
          (data.bizRegNo &&
            existing.find((e) => e.bizRegNo === data.bizRegNo)) ||
          existing.find((e) => e.name === data.name);
        if (!target) {
          skipped += 1;
          continue;
        }
        // 빈 칸으로 덮어써서 기존 정보를 지우는 일이 없게, 값이 있는 것만 갱신한다
        const patch = Object.fromEntries(
          Object.entries(data).filter(([, v]) => v != null && v !== ""),
        );
        await db.organization.update({ where: { id: target.id }, data: patch });
        created += 1;
      } else {
        await db.organization.create({ data });
        created += 1;
      }
    } catch {
      skipped += 1;
    }
  }

  revalidatePath("/organizations");
  revalidatePath("/");
  return { done: { created, skipped } };
}
