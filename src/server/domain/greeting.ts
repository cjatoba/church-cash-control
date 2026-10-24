export function greetByFirstName(fullName: string): string {
  const firstName = fullName.trim().split(/\s+/)[0];
  return firstName ? `Olá, ${firstName}!` : "Olá!";
}
