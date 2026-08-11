"use server";

import { revalidatePath } from "next/cache";
import { db } from "./db";
import { parseCourseWorkbook, type ParsedRow } from "./excel";
import { STARTER_COURSES } from "./starter-courses";
import { requireUser } from "./session";

export type CourseImportState = {
  error?: string;
  rows?: ParsedRow[];
  done?: { created: number; skipped: number };
};

/**
 * 기본 과정 세트를 불러온다.
 *
 * 이미 있는 과정코드는 건드리지 않는다. 여러 번 눌러도 안전하고,
 * 이미 운영 중인 과정의 시수·단가를 덮어쓰는 사고가 나지 않는다.
 */
export async function loadStarterCourses(): Promise<{
  created: number;
  skipped: number;
}> {
  await requireUser();

  const existing = await db.course.findMany({ select: { code: true } });
  const have = new Set(existing.map((c) => c.code));

  const toCreate = STARTER_COURSES.filter((c) => !have.has(c.code));

  if (toCreate.length > 0) {
    await db.course.createMany({
      data: toCreate.map((c) => ({
        code: c.code,
        name: c.name,
        category: c.category,
        format: c.format,
        durationHours: c.durationHours,
        defaultPrice: c.defaultPrice,
        minHeadcount: c.minHeadcount ?? null,
        description: c.description,
      })),
    });
  }

  revalidatePath("/courses");
  return {
    created: toCreate.length,
    skipped: STARTER_COURSES.length - toCreate.length,
  };
}

/* -------------------------------------------------------------------------- */
/*  엑셀 일괄 등록                                                              */
/* -------------------------------------------------------------------------- */

export async function previewCourseImport(
  _prev: CourseImportState,
  fd: FormData,
): Promise<CourseImportState> {
  await requireUser();

  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "엑셀 파일을 선택해 주세요." };
  }
  if (!/\.xlsx$/i.test(file.name)) {
    return { error: "xlsx 파일만 읽을 수 있습니다." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { error: "파일이 너무 큽니다 (5MB 이하)." };
  }

  const existing = await db.course.findMany({ select: { code: true, name: true } });

  try {
    const rows = await parseCourseWorkbook(await file.arrayBuffer(), existing);
    if (rows.length === 0) return { error: "읽을 수 있는 데이터가 없습니다." };
    return { rows };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "파일을 읽지 못했습니다." };
  }
}

export async function commitCourseImport(
  _prev: CourseImportState,
  fd: FormData,
): Promise<CourseImportState> {
  await requireUser();

  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "파일이 없습니다. 다시 올려 주세요." };
  }
  const onDuplicate = String(fd.get("onDuplicate") ?? "skip");

  const existing = await db.course.findMany({
    select: { id: true, code: true, name: true },
  });

  let rows: ParsedRow[];
  try {
    rows = await parseCourseWorkbook(await file.arrayBuffer(), existing);
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
      code: String(row.values.code),
      name: String(row.values.name),
      category: (row.values.category as string) ?? "기타",
      format: (row.values.format as string) ?? "집합",
      durationHours: (row.values.durationHours as number) ?? 8,
      defaultPrice: Math.round((row.values.defaultPrice as number) ?? 0),
      minHeadcount: (row.values.minHeadcount as number) ?? null,
      description: (row.values.description as string) ?? null,
    };

    try {
      if (row.duplicateOf && onDuplicate === "update") {
        const target = existing.find((e) => e.code === data.code);
        if (!target) {
          skipped += 1;
          continue;
        }
        // 빈 값으로 기존 과정을 지우지 않도록, 채워진 항목만 갱신한다
        const patch = Object.fromEntries(
          Object.entries(data).filter(([, v]) => v != null && v !== ""),
        );
        await db.course.update({ where: { id: target.id }, data: patch });
        created += 1;
      } else {
        await db.course.create({ data });
        created += 1;
      }
    } catch {
      skipped += 1;
    }
  }

  revalidatePath("/courses");
  return { done: { created, skipped } };
}
