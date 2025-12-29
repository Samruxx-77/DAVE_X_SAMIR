const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { handleCommands } = require('./commands');
const pino = require('pino');

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ["DAVE-X", "Chrome", "1.0.0"]
    });

    // 🔐 Save session
    sock.ev.on('creds.update', saveCreds);

    // 🔁 Connection updates
    sock.ev.on('connection.update', async (update) => {
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

    // 🔢 PAIRING CODE (instead of QR)
    if (!state.creds.registered) {
        const phoneNumber = process.env.PHONE_NUMBER;
        if (!phoneNumber) {
            console.log("❌ PHONE_NUMBER not set");
            process.exit(1);
        }

        const code = await sock.requestPairingCode(phoneNumber);
        console.log(`🔢 Pairing Code: ${code}`);
        console.log("📱 WhatsApp → Linked Devices → Link with phone number");
    }

    // 📩 Message handler
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg?.message || msg.key.fromMe) return;
        await handleCommands(sock, msg);
    });
}

connectToWhatsApp();