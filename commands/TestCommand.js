
const Settings = require('../Settings');

class TestCommand {
    constructor() {
        this.moderator = true;
        this.name = 'Test';
        this.triggers = ['1', '2', '3'];
        this.settings = new Settings();
    }

    async execute(tags, channel, argument, client) {
        try {
            if (argument.trim() && argument.toLowerCase() === 'name') {
                await this.settings.saveName(channel, "Raynna");
            }
            return `This is a test command executed by ${channel} @${tags.username}`;
        } catch (error) {
            console.error('Error in FontCommand.execute:', error);
            return 'An error occurred while changing the font style.';
        }
    }
}

module.exports = TestCommand;
