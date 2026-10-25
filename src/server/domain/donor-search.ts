// Quem pesquisa digita no celular sem se preocupar com acento ou maiúscula
// ("jose" precisa achar "José"), então os dois lados são comparados sem eles.
function normalizeForSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

// Cada palavra é procurada separadamente porque ninguém digita o "da"/"de"
// do meio do nome: "maria silva" precisa achar "Maria da Silva".
export function matchesDonorName(donorName: string, query: string): boolean {
  const normalizedName = normalizeForSearch(donorName);
  return normalizeForSearch(query)
    .split(/\s+/)
    .every((word) => normalizedName.includes(word));
}
