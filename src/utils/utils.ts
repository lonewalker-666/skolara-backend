import { Prisma } from "@prisma/client";

export function isPdf(
  mime: string | undefined,
  filename: string,
  head: Buffer,
) {
  const looksLikePdf = head.slice(0, 5).toString() === "%PDF-";
  const declaredPdf = mime === "application/pdf";
  const hasPdfExt = /\.pdf$/i.test(filename);
  // accept only real PDFs; allow browser quirks if magic header is correct
  return looksLikePdf && (declaredPdf || hasPdfExt);
}

export function buildWhere(searchTerm: string | undefined, categoryNum: number | undefined): Prisma.collegeWhereInput {
  const hasSearch = !!(searchTerm && searchTerm.trim().length > 0);
  return {
    ...(Number.isFinite(categoryNum as number)
      ? { college_type_id: categoryNum }
      : {}),
    ...(hasSearch
      ? {
          OR: [
            { name: { startsWith: searchTerm!.trim(), mode: "insensitive" } },
            { short_name: { contains: searchTerm!.trim(), mode: "insensitive" } },
          ],
        }
      : {}),
  };
}