// Quem pesquisa digita no celular sem se preocupar com acento ou maiúscula
// ("jose" precisa achar "José"), então os dois lados são comparados sem eles.
function normalizeForSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export function matchesDonorName(donorName: string, query: string): boolean {
  return normalizeForSearch(donorName).includes(normalizeForSearch(query));
}
