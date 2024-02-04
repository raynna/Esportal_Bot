
class Toggle {
    constructor() {
        this.moderator = true;
        this.name = 'Toggle';
        this.settings = require('../Settings').getInstance();
        this.commands = require('../Commands').getInstance();
    }

    async execute(tags, channel, argument, client) {
        try {
            const command = argument ? argument.toLowerCase().trim() : "";
            const validCommands = this.commands.getValidCommands();
            const formattedList = this.commands.formatCommandList(validCommands);
            if (!command) {
                return `Please provide a command, usage; -> !toggle command, commands -> ${formattedList}`;
            }
            if (command === 'enabled') {
                const enabled = this.settings[channel]?.toggled
                    ? validCommands.filter(command => !this.settings[channel].toggled.includes(command))
                    : validCommands;
                const formattedList = this.commands.formatCommandList(enabled);
                return `Enabled commands in ${channel} are: ${formattedList}`;
            }
            if (command === 'disabled') {
                const disabled = this.settings[channel]?.toggled || [];
                const formattedList = this.commands.formatCommandList(disabled);
                return `Disabled commands in ${channel} are: ${formattedList}`;
            }
            if (command === 'toggle') {
                return `You can't toggle this command.`;
            }
            const commandClass = this.commands.findCommandClassByTrigger(command, validCommands);
            if (commandClass) {
                const triggers = this.commands.getCommandTriggers(commandClass);
                return this.settings.toggle(channel, command, triggers);
            }
            return `Couldn't find any command with trigger ${command}.`;
        } catch (error) {
            console.error('Error on toggle:', error);
            return 'An error occured while executing command toggle.';
        }
    }
}

module.exports = Toggle;
