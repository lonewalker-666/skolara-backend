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
