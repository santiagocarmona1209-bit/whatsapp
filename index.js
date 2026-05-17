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

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: ["Ubuntu", "Chrome", "22.04.4"],
    syncFullHistory: false,
    markOnlineOnConnect: true,
    emitOwnEvents: false
  });

  sock.ev.on("creds.update", saveCreds);

  // 🔵 CONEXIÓN
  sock.ev.on("connection.update", async (update) => {
    const { connection, qr } = update;

    if (qr) {
      qrImage = await QRCode.toDataURL(qr);
      console.log("📲 QR actualizado");
    }

    if (connection === "open") {
      console.log("✅ WhatsApp conectado");
    }

    if (connection === "close") {
      console.log("⚠️ Reconectando...");
      startBot();
    }
  });

  // 💬 MENSAJES (CRÍTICO)
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];

    console.log("🔥 EVENTO MENSAJE LLEGÓ");

    if (!msg.message || msg.key.fromMe) return;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text;

    if (!text) return;

    const from = msg.key.remoteJid;
    const msgText = text.toLowerCase().trim();

    console.log("📩 TEXTO:", msgText);

    if (msgText === "hola") {
      await sock.sendMessage(from, { text: "👋 Hola! Funciono en Render" });
    }

    if (msgText === "menu") {
      await sock.sendMessage(from, {
        text: "📋 Menú:\n- hola\n- menu"
      });
    }
  });
}

startBot();

// 🌐 WEB QR
app.get("/", (req, res) => {
  res.send(`
    <html>
      <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;">
        <h2>Escanea el QR</h2>
        ${qrImage ? `<img src="${qrImage}" width="300"/>` : "<p>Esperando QR...</p>"}
      </body>
    </html>
  `);
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Servidor listo en Render");
});
