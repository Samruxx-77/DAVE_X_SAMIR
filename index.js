const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { handleCommands } = require('./commands');
const pino = require('pino');

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_v2');

    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ["DAVE-X", "Chrome", "1.0.0"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) connectToWhatsApp();
        }

        if (connection === 'open') {
            console.log('✅ DAVE-X is now connected to WhatsApp!');
        }
    });

    // 🔢 Pairing code (HARDCODED NUMBER)
    if (!state.creds.registered) {
        try {
            const code = await sock.requestPairingCode("916002213823");
            console.log("🔢 Pairing Code:", code);
            console.log("📱 WhatsApp → Linked Devices → Link with phone number");
        } catch (err) {
            console.error("❌ Failed to get pairing code:", err.message);
        }
    }

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg?.message || msg.key.fromMe) return;
        await handleCommands(sock, msg);
    });
}

connectToWhatsApp();
