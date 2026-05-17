import { webcrypto } from "crypto";

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}
import express from "express";
import pkg from "@whiskeysockets/baileys";
import QRCode from "qrcode";

const { default: makeWASocket, useMultiFileAuthState } = pkg;
const app = express();

let qrImage = null;

// 🔵 BOT WHATSAPP
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false
    browser: ["kali linux", "Chrome", "22.04.4"],
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    retryRequestDelayMs: 2000
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { qr } = update;

    if (qr) {
      qrImage = await QRCode.toDataURL(qr);
      console.log("QR actualizado");
    }
    
  if (connection === "close") {
    console.log("⚠️ Conexión cerrada, reconectando...");
    startBot(); // 🔁 reconexión automática
  }

  if (connection === "open") {
    console.log("✅ WhatsApp conectado");
  }
 });

startBot();

// 🌐 WEB (HTML)
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>WhatsApp Bot QR</title>
      </head>
      <body style="display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;">
        <h2>Escanea el QR</h2>
        ${qrImage ? `<img src="${qrImage}" width="300"/>` : "<p>Esperando QR...</p>"}
      </body>
    </html>
  `);
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Servidor listo");
});
