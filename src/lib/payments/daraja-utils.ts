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
