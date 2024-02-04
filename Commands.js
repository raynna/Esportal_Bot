const fs = require('fs');
const path = require('path');

class Commands {
    constructor() {
        this.commands = {};
        this.loadCommands();
    }

    loadCommands() {
        try {
            const commandFiles = fs.readdirSync(path.join(__dirname, 'commands'));

            console.log('Found command files:', commandFiles);

            commandFiles.forEach(file => {
                if (!file.startsWith('_')) {
                    try {
                        console.log(`Loading command from file: ${file}`);

                        const CommandClass = require(`./commands/${file}`);
                        const commandInstance = new CommandClass();

                        if (typeof CommandClass === 'function') {
                            if (commandInstance.triggers && Array.isArray(commandInstance.triggers) && commandInstance.triggers.length > 0) {
                                // If there are triggers, add both triggers and the main instance name
                                const commandName = file.replace('.js', '').toLowerCase();
                                this.commands[commandName] = commandInstance;

                                commandInstance.triggers.forEach(trigger => {
                                    const triggerName = trigger.toLowerCase();
                                    this.commands[triggerName] = commandInstance;
                                });

                                console.log(`Command ${commandName} loaded with triggers: ${commandInstance.triggers.join(', ')}`);
                            } else {
                                // If no triggers, add only the main instance name
                                const commandName = file.replace('.js', '').toLowerCase();
                                this.commands[commandName] = commandInstance;

                                console.log(`Command ${commandName} loaded without triggers`);
                            }
                        } else {
                            console.error(`Error loading command from file ${file}: CommandClass is not a constructor.`);
                        }
                    } catch (error) {
                        console.error(`Error loading command from file ${file}:`, error);
                    }
                }
            });

            console.log('Commands loaded successfully:', this.commands);
        } catch (error) {
            console.error('Error reading command files:', error);
        }
    }
}

module.exports = Commands;
