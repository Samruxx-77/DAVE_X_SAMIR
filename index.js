const {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require('@whiskeysockets/baileys');

const pino = require('pino');
const qrcode = require('qrcode-terminal');
const { handleCommands } = require('./commands');

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true, // 🔑 VERY IMPORTANT
    browser: ['DAVE-X', 'Chrome', '1.0.0']
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    // QR
    if (qr) {
      console.log('\n📱 Scan this QR code:\n');
      qrcode.generate(qr, { small: true });
    }

    // Connected
    if (connection === 'open') {
      console.log('✅ DAVE-X is now connected to WhatsApp!');
    }

    // Disconnected
    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

      if (shouldReconnect) {
        console.log('🔁 Reconnecting in 5 seconds...');
        setTimeout(connectToWhatsApp, 5000);
      } else {
        console.log('❌ Logged out. Delete auth_info and scan again.');
      }
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;
    await handleCommands(sock, msg);
  });
}

connectToWhatsApp();
