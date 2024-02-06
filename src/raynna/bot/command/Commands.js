const fs = require('fs');
const path = require('path');

class Commands {
    constructor() {
        this.commands = {};
        this.loadCommands();
    }

    static getInstance() {
        return this;
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

    static getValidCommands() {
        const commandsFolder = path.join(__dirname, '.', 'commands');
        return fs.readdirSync(commandsFolder)
            .filter(file => fs.statSync(path.join(commandsFolder, file)).isFile())
            .map(file => path.parse(file).name)
            .filter(command => command.moderator) === true;
    }

    commandExists(commandName) {
        return this.commands.hasOwnProperty(commandName);
    }

    static formatCommandList(commands) {
        return commands.length > 0 ? commands.join(', ') : 'None';
    }

    static findCommandClassByTrigger(trigger, validCommands) {
        for (const command of validCommands) {
            const CommandClass = require(path.join(__dirname, '.', 'commands', command));
            const instance = new CommandClass();

            if ((instance.triggers && instance.triggers.includes(trigger)) || command.toLowerCase() === trigger) {
                return command.toLowerCase();
            }
        }
        return null;
    }

    static getCommandTriggers(commandClass) {
        const CommandClass = require(path.join(__dirname, '.', 'commands', commandClass));
        const instance = new CommandClass();
        return instance.triggers ? [commandClass, ...instance.triggers] : [commandClass];
    }


    isBlockedCommand(commandInstance, channel) {
        /*const toggleConfig = this.loadToggleConfig();
        const channelConfig = toggleConfig[channel] || [];
        const commandName = commandInstance.name;
        const blocked = commandName && (channelConfig.includes(commandName.toLowerCase()) || channelConfig.includes(`!${commandName.toLowerCase()}`));
        return blocked;*/
        return false;
    }

    isModeratorCommand(commandInstance) {
        return commandInstance?.moderator ?? false;
    }
}

module.exports = Commands;
