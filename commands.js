const { getUptime, getRAM, getSpeed } = require('./utils');

async function handleCommands(sock, msg) {
    const from = msg.key.remoteJid;
    const type = Object.keys(msg.message)[0];
    const body =
        type === 'conversation' ? msg.message.conversation :
        type === 'extendedTextMessage' ? msg.message.extendedTextMessage.text :
        type === 'imageMessage' ? msg.message.imageMessage.caption : '';

    const prefix = ".";
    if (!body || !body.startsWith(prefix)) return;

    const command = body.slice(prefix.length).trim().split(/ +/).shift().toLowerCase();
    const args = body.trim().split(/ +/).slice(1);

    switch (command) {
        case 'menu':
        case 'help': {
            const menu = `┏━━━━━✧ DAVE-X MENU ✧━━━━━━━
┃✧ Prefix: [${prefix}]
┃✧ Owner: Samir
┃✧ Mode: public
┃✧ Platform: Linux
┃✧ Speed: ${getSpeed(msg.messageTimestamp)} ms
┃✧ Uptime: ${getUptime()}
┃✧ Version: v2.6.4
┃✧ RAM: ${getRAM()}
┗━━━━━━━━━━━━━━━━━━━━━━━━━

┏━━━━━✧ OWNER MENU ✧━━━━━━━
┃› .ban | .restart | .unban
┃› .promote | .demote | .kick
┗━━━━━━━━━━━━━━━━━━━━━━━━━

┏━━━━━✧ AI MENU ✧━━━━━━━
┃› .ai | .gpt | .gemini | .imagine
┗━━━━━━━━━━━━━━━━━━━━━━━━━

┏━━━━━✧ MAIN MENU ✧━━━━━━━
┃› .play | .song | .video | .ping
┗━━━━━━━━━━━━━━━━━━━━━━━━━

┏━━━━━✧ 🎄 MERRY CHRISTMAS ✧━━━━━━━
┃✧ Developer: Samir
┃✧ Bot: DAVE-X
┗━━━━━━━━━━━━━━━━━━━━━━━━━`;
            await sock.sendMessage(from, { text: menu });
            break;
        }

        case 'ping':
            await sock.sendMessage(from, { text: `Pong! Speed: ${getSpeed(msg.messageTimestamp)}ms` });
            break;

        case 'kick': {
            if (!msg.key.participant) return;
            const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
            const user = args[0]
                ? args[0].replace('@', '') + '@s.whatsapp.net'
                : (mentioned ? mentioned[0] : null);
            if (!user) return sock.sendMessage(from, { text: "Tag a user to kick." });
            await sock.groupParticipantsUpdate(from, [user], "remove");
            await sock.sendMessage(from, { text: "Successfully kicked." });
            break;
        }

        default:
            // unknown command
            break;
    }
}

module.exports = { handleCommands };