const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const { handleCommands } = require("./commands");

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    browser: ["DAVE-X", "Chrome", "1.0.0"]
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

      if (shouldReconnect) {
        console.log("🔄 Reconnecting...");
        connectToWhatsApp();
      }
    }

    if (connection === "open") {
      console.log("✅ DAVE-X is now connected to WhatsApp!");
    }
  });

  // 🔐 Pairing code (ONLY ONCE, with delay)
  if (!state.creds.registered) {
    try {
      await new Promise((r) => setTimeout(r, 4000));
      const code = await sock.requestPairingCode("916002213823");
      console.log("📲 Pairing Code:", code);
      console.log("WhatsApp → Linked Devices → Link with phone number");
    } catch (err) {
      console.error("❌ Failed to get pairing code:", err.message);
    }
  }

  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0];
    if (!msg?.message || msg.key.fromMe) return;
    await handleCommands(sock, msg);
  });
}

connectToWhatsApp();
