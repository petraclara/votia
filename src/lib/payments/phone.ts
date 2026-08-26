/**
 * Normalize Kenyan M-Pesa phone numbers to Daraja format: 2547XXXXXXXX
 */
export function normalizeMpesaPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (!digits) return null;

  let normalized = digits;
  if (normalized.startsWith("254") && normalized.length === 12) {
    // already 2547XXXXXXXX
  } else if (normalized.startsWith("0") && normalized.length === 10) {
    normalized = `254${normalized.slice(1)}`;
  } else if (normalized.length === 9 && normalized.startsWith("7")) {
    normalized = `254${normalized}`;
  } else if (normalized.startsWith("2540") && normalized.length === 13) {
    normalized = `254${normalized.slice(4)}`;
  } else {
    return null;
  }

  if (!/^2547\d{8}$/.test(normalized)) return null;
  return normalized;
}
