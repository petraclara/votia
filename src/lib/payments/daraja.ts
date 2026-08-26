import "server-only";
import { getAppUrl } from "@/lib/site";
import { normalizeMpesaPhone } from "@/lib/payments/phone";
import {
  accountReferenceFromApiRef,
  buildStkPassword,
  buildStkPushPayload,
  darajaApiBaseUrl,
  isPublicHttpsUrl,
  mapDarajaResultToState,
  parseStkCallback,
  type PaymentProviderState,
} from "@/lib/payments/daraja-utils";

export type { StkCallbackBody } from "@/lib/payments/daraja-types";
export type { ParsedStkCallback, PaymentProviderState } from "@/lib/payments/daraja-utils";
export {
  accountReferenceFromApiRef,
  mapDarajaResultToState,
  parseStkCallback,
};

type DarajaTokenResponse = {
  access_token?: string;
  expires_in?: string;
  errorMessage?: string;
  error_description?: string;
};

type StkPushResponse = {
  MerchantRequestID?: string;
  CheckoutRequestID?: string;
  ResponseCode?: string;
  ResponseDescription?: string;
  CustomerMessage?: string;
  errorCode?: string;
  errorMessage?: string;
};

type StkQueryResponse = {
  ResponseCode?: string;
  ResponseDescription?: string;
  MerchantRequestID?: string;
  CheckoutRequestID?: string;
  ResultCode?: string | number;
  ResultDesc?: string;
  errorCode?: string;
  errorMessage?: string;
};

export type StkQueryResult = {
  checkoutRequestId: string;
  resultCode: number | null;
  resultDesc: string;
  state: PaymentProviderState;
  rateLimited: boolean;
  httpStatus: number;
  raw: unknown;
};

const DARAJA_TIMEOUT_MS = 20_000;

let cachedToken: { value: string; expiresAt: number } | null = null;

async function darajaFetch(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DARAJA_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Daraja request timed out.");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export function isDarajaConfigured() {
  return Boolean(
    process.env.DARAJA_CONSUMER_KEY?.trim() &&
      process.env.DARAJA_CONSUMER_SECRET?.trim() &&
      process.env.DARAJA_PASSKEY?.trim() &&
      process.env.DARAJA_SHORTCODE?.trim(),
  );
}

function requireDarajaConfig() {
  const consumerKey = process.env.DARAJA_CONSUMER_KEY?.trim();
  const consumerSecret = process.env.DARAJA_CONSUMER_SECRET?.trim();
  const passkey = process.env.DARAJA_PASSKEY?.trim();
  const shortcode = process.env.DARAJA_SHORTCODE?.trim();

  if (!consumerKey || !consumerSecret || !passkey || !shortcode) {
    throw new Error("Daraja credentials are not configured on the server.");
  }

  return { consumerKey, consumerSecret, passkey, shortcode };
}

function timestampNow() {
  const now = new Date();
  const yyyy = now.getFullYear().toString();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}${hh}${mi}${ss}`;
}

function transactionType() {
  return process.env.DARAJA_TRANSACTION_TYPE?.trim() || "CustomerPayBillOnline";
}

function partyB(shortcode: string) {
  return process.env.DARAJA_PARTY_B?.trim() || shortcode;
}

function callbackUrl() {
  const explicit = process.env.DARAJA_CALLBACK_URL?.trim().replace(/\/$/, "");
  if (explicit) {
    if (!isPublicHttpsUrl(explicit)) {
      throw new Error(
        "DARAJA_CALLBACK_URL must be a public https:// URL (not localhost).",
      );
    }
    return explicit.includes("/api/webhooks/daraja")
      ? explicit
      : `${explicit}/api/webhooks/daraja`;
  }

  const fromApp = `${getAppUrl()}/api/webhooks/daraja`;
  if (isPublicHttpsUrl(fromApp)) {
    return fromApp;
  }

  throw new Error(
    "Daraja requires a public HTTPS CallBackURL. Keep NEXT_PUBLIC_APP_URL=http://localhost:3000, and set DARAJA_CALLBACK_URL to an HTTPS tunnel or Vercel URL (example: https://xxxx.trycloudflare.com/api/webhooks/daraja).",
  );
}

export function getDarajaCallbackUrl() {
  return callbackUrl();
}

async function readResponseBody(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();
  const preview = text.replace(/\s+/g, " ").trim().slice(0, 240);
  let json: unknown = null;
  const looksJson =
    contentType.includes("application/json") ||
    text.trim().startsWith("{") ||
    text.trim().startsWith("[");

  if (looksJson && text.trim()) {
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      json = null;
    }
  }

  return { contentType, text, preview, json };
}

function isStillProcessingPayload(data: StkQueryResponse | null) {
  if (!data) return false;
  const code = `${data.errorCode ?? ""}`;
  const message = `${data.errorMessage ?? data.ResponseDescription ?? data.ResultDesc ?? ""}`.toLowerCase();
  return (
    code === "500.001.1001" ||
    message.includes("being processed") ||
    message.includes("the transaction is being processed")
  );
}

export async function getDarajaAccessToken() {
  const { consumerKey, consumerSecret } = requireDarajaConfig();
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 30_000) {
    return cachedToken.value;
  }

  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
  const url = `${darajaApiBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`;
  const response = await darajaFetch(url, {
    method: "GET",
    headers: { Authorization: `Basic ${credentials}` },
  });
  const body = await readResponseBody(response);
  const data = (body.json ?? {}) as DarajaTokenResponse;

  if (!response.ok || !data.access_token) {
    console.error("Daraja OAuth failed", {
      status: response.status,
      contentType: body.contentType,
      bodyPreview: body.preview,
      errorMessage: data.errorMessage ?? data.error_description,
    });
    throw new Error("Unable to authenticate with Daraja.");
  }

  const expiresInSec = Number(data.expires_in ?? 3599);
  cachedToken = {
    value: data.access_token,
    expiresAt: now + Math.max(60, expiresInSec) * 1000,
  };
  return data.access_token;
}

export async function initiateStkPush(input: {
  amount: number;
  phone: string;
  apiRef: string;
  description: string;
}) {
  if (!Number.isInteger(input.amount) || input.amount < 1) {
    throw new Error("STK Push amount must be a positive whole number.");
  }

  const phone = normalizeMpesaPhone(input.phone);
  if (!phone) {
    throw new Error("Enter a valid Kenyan M-Pesa phone number.");
  }

  const { passkey, shortcode } = requireDarajaConfig();
  const token = await getDarajaAccessToken();
  const timestamp = timestampNow();
  const accountReference = accountReferenceFromApiRef(input.apiRef);
  const callBackURL = callbackUrl();
  const payload = buildStkPushPayload({
    shortcode,
    passkey,
    timestamp,
    transactionType: transactionType(),
    amount: input.amount,
    phone,
    partyB: partyB(shortcode),
    callBackURL,
    accountReference,
    transactionDesc: input.description,
  });

  console.info("Daraja STK Push initiating", {
    apiRef: input.apiRef,
    amount: input.amount,
    phone: `${phone.slice(0, 5)}****${phone.slice(-2)}`,
    shortcode,
    accountReference,
    callbackUrl: callBackURL,
    env: process.env.DARAJA_ENV ?? "sandbox",
  });

  const response = await darajaFetch(`${darajaApiBaseUrl()}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const body = await readResponseBody(response);
  const data = (body.json ?? {}) as StkPushResponse;

  if (!response.ok || data.ResponseCode !== "0" || !data.CheckoutRequestID) {
    console.error("Daraja STK Push rejected", {
      status: response.status,
      contentType: body.contentType,
      bodyPreview: body.preview,
      responseCode: data.ResponseCode,
      errorCode: data.errorCode,
      errorMessage: data.errorMessage ?? data.ResponseDescription,
      apiRef: input.apiRef,
    });
    throw new Error(data.errorMessage || data.ResponseDescription || "STK Push failed.");
  }

  console.info("Daraja STK Push accepted", {
    apiRef: input.apiRef,
    checkoutRequestId: data.CheckoutRequestID,
    merchantRequestId: data.MerchantRequestID,
  });

  return {
    checkoutRequestId: data.CheckoutRequestID,
    merchantRequestId: data.MerchantRequestID ?? null,
    customerMessage: data.CustomerMessage ?? null,
    phone,
    raw: data,
  };
}

export async function queryStkStatus(checkoutRequestId: string): Promise<StkQueryResult> {
  const { passkey, shortcode } = requireDarajaConfig();
  const token = await getDarajaAccessToken();
  const timestamp = timestampNow();
  const password = buildStkPassword(shortcode, passkey, timestamp);

  const response = await darajaFetch(`${darajaApiBaseUrl()}/mpesa/stkpushquery/v1/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }),
  });

  const body = await readResponseBody(response);
  const data = (body.json ?? null) as StkQueryResponse | null;
  const rateLimited = response.status === 429;

  if (!body.json) {
    console.error("Daraja STK Query returned non-JSON", {
      status: response.status,
      contentType: body.contentType,
      bodyPreview: body.preview,
      checkoutRequestId,
      rateLimited,
    });
    return {
      checkoutRequestId,
      resultCode: null,
      resultDesc: rateLimited ? "Rate limited by Daraja" : "Non-JSON STK Query response",
      state: "PENDING",
      rateLimited,
      httpStatus: response.status,
      raw: { preview: body.preview },
    };
  }

  if (rateLimited) {
    console.warn("Daraja STK Query rate limited", {
      status: response.status,
      checkoutRequestId,
      bodyPreview: body.preview,
    });
    return {
      checkoutRequestId: data?.CheckoutRequestID ?? checkoutRequestId,
      resultCode: null,
      resultDesc: data?.errorMessage ?? "Rate limited",
      state: "PENDING",
      rateLimited: true,
      httpStatus: response.status,
      raw: data,
    };
  }

  if (isStillProcessingPayload(data)) {
    console.info("Daraja STK Query still processing", {
      checkoutRequestId,
      errorCode: data?.errorCode,
    });
    return {
      checkoutRequestId: data?.CheckoutRequestID ?? checkoutRequestId,
      resultCode: null,
      resultDesc: data?.errorMessage ?? data?.ResponseDescription ?? "Processing",
      state: "PENDING",
      rateLimited: false,
      httpStatus: response.status,
      raw: data,
    };
  }

  if (!response.ok && data?.ResultCode === undefined) {
    console.error("Daraja STK Query failed", {
      status: response.status,
      contentType: body.contentType,
      bodyPreview: body.preview,
      errorCode: data?.errorCode,
      errorMessage: data?.errorMessage,
      checkoutRequestId,
    });
    return {
      checkoutRequestId,
      resultCode: null,
      resultDesc: data?.errorMessage || "Unable to query STK status.",
      state: "PENDING",
      rateLimited: false,
      httpStatus: response.status,
      raw: data,
    };
  }

  const resultCode =
    data?.ResultCode !== undefined && data.ResultCode !== null && data.ResultCode !== ""
      ? Number(data.ResultCode)
      : null;

  return {
    checkoutRequestId: data?.CheckoutRequestID ?? checkoutRequestId,
    resultCode: Number.isFinite(resultCode) ? resultCode : null,
    resultDesc: data?.ResultDesc ?? data?.ResponseDescription ?? "",
    state: mapDarajaResultToState(data?.ResultCode),
    rateLimited: false,
    httpStatus: response.status,
    raw: data,
  };
}

export function siteHost() {
  return getAppUrl();
}

export { normalizeMpesaPhone };
