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

  // 📡 CONEXIÓN + QR
  sock.ev.on("connection.update", async (update) => {
    const { connection, qr } = update;

    if (qr) {
      qrImage = await QRCode.toDataURL(qr);
      console.log("QR actualizado");
    }

    if (connection === "close") {
      console.log("⚠️ Conexión cerrada, reconectando...");
      startBot();
    }

    if (connection === "open") {
      console.log("✅ WhatsApp conectado");
    }
  });

  // 💬 MENSAJES + RESPUESTAS
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];

    if (!msg.message || msg.key.fromMe) return;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text;

    if (!text) return;

    const from = msg.key.remoteJid;
    const msgText = text.toLowerCase();

    if (msgText === "hola") {
      await sock.sendMessage(from, { text: "👋 Hola! ¿Cómo estás?" });
    }

    if (msgText === "usuario") {
      await sock.sendMessage(from, { text: "santiagocarmona1209@gmail.com" });
    }

    if (msgText === "contrasena") {
      await sock.sendMessage(from, { text: "$_antiago_1105379489_2011" });
    }

    if (msgText === "menu") {
      await sock.sendMessage(from, {
        text: "📋 Menú:\n- hola\n- ayuda\n- info"
      });
    }
  });
}

startBot();

// 🌐 WEB QR
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>WhatsApp Bot QR</title>
      </head>
      <body style="display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;font-family:Arial;">
        <h2>Escanea el QR</h2>
        ${qrImage ? `<img src="${qrImage}" width="300"/>` : "<p>Esperando QR...</p>"}
      </body>
    </html>
  `);
});

// 🚀 SERVER
app.listen(process.env.PORT || 3000, () => {
  console.log("Servidor listo");
});
