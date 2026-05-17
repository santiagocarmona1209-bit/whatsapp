import express from "express";
import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys";
import QRCode from "qrcode";

const app = express();

let latestQR = null;

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { qr } = update;

    if (qr) {
      latestQR = await QRCode.toDataURL(qr);
      console.log("QR actualizado");
    }
  });
}

startBot();

app.get("/", (req, res) => {
  if (!latestQR) return res.send("Esperando QR...");

  res.send(`<img src="${latestQR}" width="300"/>`);
});

app.listen(process.env.PORT || 3000);

{
  "name": "bot-whatsapp",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "type": "commonjs",
  "dependencies": {
    "@whiskeysockets/baileys": "^7.0.0-rc11",
    "express": "^5.2.1",
    "nodemailer": "^6.9.13",
    "puppeteer": "^13.7.0",
    "qrcode": "^1.5.4",
    "qrcode-terminal": "^0.12.0",
    "whatsapp-web.js": "^1.23.0"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/santiagocarmona1209-bit/whatsapp.git"
  },
  "bugs": {
    "url": "https://github.com/santiagocarmona1209-bit/whatsapp/issues"
  },
  "homepage": "https://github.com/santiagocarmona1209-bit/whatsapp#readme"
}
