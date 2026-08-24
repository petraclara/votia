import "server-only";
import { getAppUrl } from "@/lib/site";

type IntaSendChargeInput = {
  amount: number;
  currency?: string;
  api_ref: string;
  redirect_url: string;
  email?: string;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
  comment?: string;
  host?: string;
};

type IntaSendChargeResponse = {
  invoice_id?: string;
  url?: string;
  customer?: unknown;
  invoice?: {
    invoice_id?: string;
    state?: string;
    value?: string | number;
    currency?: string;
  };
};

type IntaSendStatusResponse = {
  invoice?: {
    invoice_id?: string;
    state?: string;
    value?: string | number;
    net_amount?: string | number;
    currency?: string;
    api_ref?: string;
    provider?: string;
    mpesa_reference?: string | null;
    charges?: string | number | null;
    failed_reason?: string | null;
  };
};

type IntaSendClient = {
  collection: () => {
    charge: (payload: IntaSendChargeInput) => Promise<IntaSendChargeResponse>;
    status: (invoiceId: string) => Promise<IntaSendStatusResponse>;
  };
};

function loadIntaSend(): new (
  publishableKey: string,
  secretKey: string,
  test: boolean,
) => IntaSendClient {
  // Official SDK is CommonJS.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("intasend-node");
}

export function isIntaSendConfigured() {
  return Boolean(process.env.INTASEND_PUBLIC_KEY && process.env.INTASEND_SECRET_KEY);
}

export function getIntaSendClient() {
  const publishableKey = process.env.INTASEND_PUBLIC_KEY;
  const secretKey = process.env.INTASEND_SECRET_KEY;

  if (!publishableKey || !secretKey) {
    throw new Error("IntaSend keys are not configured on the server.");
  }

  const IntaSend = loadIntaSend();
  const testMode = process.env.INTASEND_TEST_MODE !== "false";
  return new IntaSend(publishableKey, secretKey, testMode);
}

export async function createCheckout(input: IntaSendChargeInput) {
  const client = getIntaSendClient();
  const collection = client.collection();
  const host = siteHost();

  const response = await collection.charge({
    currency: "KES",
    host,
    ...input,
  });

  const checkoutUrl = response.url;
  const invoiceId = response.invoice?.invoice_id ?? response.invoice_id;

  if (!checkoutUrl) {
    throw new Error("IntaSend did not return a checkout URL.");
  }

  return { checkoutUrl, invoiceId, raw: response };
}

export async function getInvoiceStatus(invoiceId: string) {
  const client = getIntaSendClient();
  const collection = client.collection();
  return collection.status(invoiceId);
}

export function siteHost() {
  return getAppUrl();
}

export function parsePaidAmount(value: string | number | undefined) {
  if (value === undefined || value === null) return null;
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount)) return null;
  return amount;
}

export function isCompleteState(state?: string | null) {
  return (state ?? "").toUpperCase() === "COMPLETE";
}

export function isFailedState(state?: string | null) {
  return (state ?? "").toUpperCase() === "FAILED";
}
