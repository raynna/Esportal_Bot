const fs = require('fs');
const path = require('path');

class Logger {
    constructor(logFilePath = 'app.log') {
        this.logFilePath = path.join('src', 'raynna', 'bot', 'log', logFilePath);
        this.ensureLogFile();
    }

    ensureLogFile() {
        if (!fs.existsSync(this.logFilePath)) {
            fs.writeFileSync(this.logFilePath, '');
        }
    }

    log(message, level = 'info') {
        const callingMethod = this.getCallingMethod();
        const logMessage = `[${new Date().toISOString()}] [${callingMethod}] [${level.toUpperCase()}]: ${message}`;
        console.log(logMessage);
        if (level === 'error' || level === 'warning') {
            this.writeToFile(logMessage);
        }
    }

    info(message) {
        this.log(message, 'info');
    }

    warn(message) {
        this.log(message, 'warn');
    }

    error(message) {
        this.log(message, 'error');
    }

    getCallingMethod() {
        const stack = new Error().stack.split('\n');
        const callingMethodRegex = /\s+at\s(.+)\s\(/;
        let callingMethod = 'Unknown';

        for (let i = 2; i < stack.length; i++) {
            const match = callingMethodRegex.exec(stack[i]);
            if (match && !match[1].includes('Logger')) {
                callingMethod = match[1];

                // Attempt to extract file and line information
                const fileAndLineRegex = /\((.*):\d+:\d+\)/;
                const fileAndLineMatch = fileAndLineRegex.exec(stack[i + 1]);

                if (fileAndLineMatch) {
                    callingMethod += ` (${fileAndLineMatch[1]})`;
                }

                break;
            }
        }

        return callingMethod;
    }




    writeToFile(logMessage) {
        fs.appendFile(this.logFilePath, logMessage + '\n', (err) => {
            if (err) {
                console.error('Error writing to log file:', err);
            }
        });
    }
}

module.exports = Logger;
