const fs = require('fs');
const path = require('path');

let logFilePath = 'app.log';

async function log(method = '', message, level = 'info') {
    const timestamp = new Date().toLocaleString();
    const logMessage = `${timestamp} -> [${method}] -> ${message}`;
    console.log(logMessage);
    if (level === 'error' || level === 'warning') {
        writeToFile(logMessage);
    }
}

async function info(method, message,) {
    await log(method, message, 'info');
}

async function warn(message) {
    await log('', message, 'warn');
}

async function error(message) {
    await log('', message, 'error');
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

module.exports = { warn, error, info, log };
