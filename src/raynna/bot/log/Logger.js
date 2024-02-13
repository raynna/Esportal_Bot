const fs = require('fs');
const path = require('path');

let logFilePath = 'app.log';

async function log(client = null, channel = null, method = '', message, level = 'info', printInfo = false) {
    const timestamp = new Date().toLocaleString();
    const logMessage = `${timestamp} -> [${method}] -> ${message}`;
    console.log(logMessage);
    if (client && channel) {
        await client.say("raynnacs", logMessage.toString());
    }
    if (level === 'error' || level === 'warning') {
        writeToFile(logMessage);
    }
}

async function info(method, message,) {
    await log(null, null, method, message, 'info');
}

async function printInfo(client, channel, method, message) {
    await log(client, channel, method, message, 'info');
}

async function warn(message) {
    await log(null, null, '', message, 'warn');
}

async function error(message) {
    await log(null, null, '', message, 'error');
}

function ensureLogFile() {
    if (!fs.existsSync(this.logFilePath)) {
        fs.writeFileSync(this.logFilePath, '');
    }
}

function writeToFile(logMessage) {
    ensureLogFile();
    this.logFilePath = path.join('src', 'raynna', 'bot', 'log', logFilePath);
    fs.appendFile(this.logFilePath, logMessage + '\n', (err) => {
        if (err) {
            console.error('Error writing to log file:', err);
        }
    });
}

module.exports = { warn, error, info, log, printInfo };
