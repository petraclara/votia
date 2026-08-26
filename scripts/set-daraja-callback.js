const fs = require("fs");

const tunnelOrigin = process.argv[2];
if (!tunnelOrigin || !tunnelOrigin.startsWith("https://")) {
  console.error("Usage: node scripts/set-daraja-callback.js https://xxxx.trycloudflare.com");
  process.exit(1);
}

const callback = `${tunnelOrigin.replace(/\/$/, "")}/api/webhooks/daraja`;
const path = ".env";
let text = fs.readFileSync(path, "utf8").replace(/^\uFEFF/, "");
const re = /^DARAJA_CALLBACK_URL=.*$/m;
const line = `DARAJA_CALLBACK_URL="${callback}"`;
if (re.test(text)) {
  text = text.replace(re, line);
} else {
  text += `\n${line}\n`;
}
fs.writeFileSync(path, text);
console.log("DARAJA_CALLBACK_URL=(set)");
