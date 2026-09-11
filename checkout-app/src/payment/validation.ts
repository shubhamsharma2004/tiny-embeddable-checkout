export function normalizeCardNumber(input: string): string {
  return input.replace(/\D/g, '').slice(0, 16);
}

export function formatCardNumber(input: string): string {
  const digits = normalizeCardNumber(input);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

export function isValidCardNumber(digits: string): boolean {
  return /^\d{16}$/.test(digits);
}

export function formatExpiry(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function isValidExpiry(mmYy: string): boolean {
  const match = /^(\d{2})\/(\d{2})$/.exec(mmYy);
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;
  return true;
}

export function normalizeCvc(input: string): string {
  return input.replace(/\D/g, '').slice(0, 4);
}

export function isValidCvc(cvc: string): boolean {
  return /^\d{3,4}$/.test(cvc);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
