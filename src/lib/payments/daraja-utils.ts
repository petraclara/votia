import type { StkCallbackBody, StkCallbackMetadataItem } from "./daraja-types";

export type PaymentProviderState = "COMPLETE" | "FAILED" | "CANCELLED" | "PENDING";

export type ParsedStkCallback = {
  merchantRequestId: string | null;
  checkoutRequestId: string | null;
  resultCode: number;
  resultDesc: string;
  amount: number | null;
  mpesaReceiptNumber: string | null;
  phoneNumber: string | null;
  transactionDate: string | null;
};

/** Daraja AccountReference max length is 12. */
export function accountReferenceFromApiRef(apiRef: string) {
  const compact = apiRef.replace(/[^a-zA-Z0-9]/g, "");
  return compact.slice(0, 12) || "VOTIA";
}

export function mapDarajaResultToState(
  resultCode: number | string | null | undefined,
): PaymentProviderState {
  if (resultCode === null || resultCode === undefined || resultCode === "") {
    return "PENDING";
  }
  const code = Number(resultCode);
  if (!Number.isFinite(code)) return "PENDING";
  if (code === 0) return "COMPLETE";
  // User cancelled the STK prompt
  if (code === 1032) return "CANCELLED";
  // Includes 1037 (timeout), 4999 (failed), insufficient funds, wrong PIN, etc.
  return "FAILED";
}

function metadataValue(
  items: StkCallbackMetadataItem[] | undefined,
  name: string,
): string | number | null {
  const item = items?.find((entry) => entry.Name === name);
  if (!item || item.Value === undefined || item.Value === null) return null;
  return item.Value;
}

export function darajaApiBaseUrl(env = process.env.DARAJA_ENV) {
  return env?.trim().toLowerCase() === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";
}

export function buildStkPassword(shortcode: string, passkey: string, timestamp: string) {
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
}

export function sanitizeTransactionDesc(description: string) {
  return description.replace(/[^a-zA-Z0-9 ]/g, "").slice(0, 13) || "Votia pay";
}

export function isPublicHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "::1" ||
      host.endsWith(".local") ||
      host.endsWith(".internal")
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export type StkPushPayload = {
  BusinessShortCode: string;
  Password: string;
  Timestamp: string;
  TransactionType: string;
  Amount: number;
  PartyA: string;
  PartyB: string;
  PhoneNumber: string;
  CallBackURL: string;
  AccountReference: string;
  TransactionDesc: string;
};

export function buildStkPushPayload(input: {
  shortcode: string;
  passkey: string;
  timestamp: string;
  transactionType: string;
  amount: number;
  phone: string;
  partyB: string;
  callBackURL: string;
  accountReference: string;
  transactionDesc: string;
}): StkPushPayload {
  return {
    BusinessShortCode: input.shortcode,
    Password: buildStkPassword(input.shortcode, input.passkey, input.timestamp),
    Timestamp: input.timestamp,
    TransactionType: input.transactionType,
    Amount: input.amount,
    PartyA: input.phone,
    PartyB: input.partyB,
    PhoneNumber: input.phone,
    CallBackURL: input.callBackURL,
    AccountReference: input.accountReference,
    TransactionDesc: sanitizeTransactionDesc(input.transactionDesc),
  };
}

export function nextPaymentPollMs(input: {
  terminal: boolean;
  retryAfterMs?: number | null;
  queryIntervalMs?: number;
  minMs?: number;
}) {
  if (input.terminal) return 0;
  return Math.max(
    input.queryIntervalMs ?? 20_000,
    input.retryAfterMs ?? 0,
    input.minMs ?? 5_000,
  );
}

export function parseStkCallback(payload: StkCallbackBody): ParsedStkCallback {
  const callback = payload.Body?.stkCallback;
  const items = callback?.CallbackMetadata?.Item;
  const amountRaw = metadataValue(items, "Amount");
  const amount = amountRaw === null ? null : Number(amountRaw);

  return {
    merchantRequestId: callback?.MerchantRequestID ?? null,
    checkoutRequestId: callback?.CheckoutRequestID ?? null,
    resultCode: Number(callback?.ResultCode ?? NaN),
    resultDesc: callback?.ResultDesc ?? "",
    amount: Number.isFinite(amount) ? amount : null,
    mpesaReceiptNumber:
      metadataValue(items, "MpesaReceiptNumber")?.toString() ?? null,
    phoneNumber: metadataValue(items, "PhoneNumber")?.toString() ?? null,
    transactionDate: metadataValue(items, "TransactionDate")?.toString() ?? null,
  };
}
