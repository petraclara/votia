const fs = require("fs");

function loadEnv(filePath) {
  const text = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv(".env");

async function main() {
  const key = process.env.DARAJA_CONSUMER_KEY?.trim();
  const secret = process.env.DARAJA_CONSUMER_SECRET?.trim();
  const short = process.env.DARAJA_SHORTCODE?.trim();
  const pass = process.env.DARAJA_PASSKEY?.trim();
  const env = (process.env.DARAJA_ENV || "sandbox").toLowerCase();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  console.log(
    JSON.stringify(
      {
        configured: Boolean(key && secret && short && pass),
        env,
        shortcodeSet: Boolean(short),
        passkeySet: Boolean(pass),
        consumerKeySet: Boolean(key),
        consumerSecretSet: Boolean(secret),
        appUrl,
      },
      null,
      2,
    ),
  );

  if (!key || !secret) {
    console.log("oauthSkipped: missing consumer credentials");
    process.exit(1);
  }

  const auth = Buffer.from(`${key}:${secret}`).toString("base64");
  const base =
    env === "production"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";
  const res = await fetch(
    `${base}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` } },
  );
  const text = await res.text();
  let data = {};
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text.slice(0, 200) };
  }
  console.log(
    JSON.stringify(
      {
        oauthStatus: res.status,
        hasToken: Boolean(data.access_token),
        oauthError:
          data.errorMessage || data.error_description || data.error || null,
      },
      null,
      2,
    ),
  );
  process.exit(data.access_token ? 0 : 1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
