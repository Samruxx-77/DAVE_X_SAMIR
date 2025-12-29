const os = require('os');

const startTime = Date.now();

function getUptime() {
    const seconds = Math.floor((Date.now() - startTime) / 1000);
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor(seconds % (3600*24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
}

function getRAM() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const percentage = Math.floor((used / total) * 100);
    const bar = "█".repeat(Math.floor(percentage / 10)) + "░".repeat(10 - Math.floor(percentage / 10));
    return `${bar} ${percentage}%`;
}

function getSpeed(timestamp) {
    return Date.now() - (timestamp * 1000);
}

module.exports = { getUptime, getRAM, getSpeed };