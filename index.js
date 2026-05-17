import { webcrypto } from "crypto";

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}

import express from "express";
import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys";

import QRCode from "qrcode";

const app = express();

let qrImage = null;

// 🔵 BOT WHATSAPP
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth");

  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: ["Kali Linux", "Chrome", "22.04.4"],
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    retryRequestDelayMs: 2000
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, qr } = update;

    // 📲 generar QR para web
    if (qr) {
      qrImage = await QRCode.toDataURL(qr);
      console.log("QR actualizado");
    }

    // 🔴 reconexión automática
    if (connection === "close") {
      console.log("⚠️ Conexión cerrada, reconectando...");
      startBot();
    }

    // 🟢 conectado
    if (connection === "open") {
      console.log("✅ WhatsApp conectado");
    }
  });
}

startBot();

// 🌐 SERVIDOR WEB
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>WhatsApp Bot QR</title>
      </head>
      <body style="display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;font-family:Arial;">
        <h2>Escanea el QR</h2>

        ${
          qrImage
            ? `<img src="${qrImage}" width="300"/>`
            : "<p>Esperando QR...</p>"
        }

      </body>
    </html>
  `);
});

// 🚀 START SERVER
app.listen(process.env.PORT || 3000, () => {
  console.log("Servidor listo");
});
