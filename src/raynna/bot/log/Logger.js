const fs = require('fs');
const path = require('path');

let logFilePath = 'app.log';

function log(method, message, level = 'info') {
    const timestamp = new Date().toLocaleString();

    const logMessage = `[${method}] [${timestamp}]: ${message}`;
    console.log(logMessage);
    if (level === 'error' || level === 'warning') {
        writeToFile(logMessage);
    }
}

function info(method, message,) {
    log(method, message, 'info');
}

function warn(message) {
    log(message, 'warn');
}

function error(message) {
    log(message, 'error');
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
