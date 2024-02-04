
const Settings = require('../Settings');

class EsportalName {
    constructor() {
        this.moderator = true;
        this.name = 'Esportalname';
        this.triggers = ['register'];
        this.settings = new Settings();
    }

    async execute(tags, channel, argument, client) {
        try {
            const name = argument ? argument.trim() : "";
            if (!name) {
                return `Please provide a username, usage; -> !esportalname name`;
            }
            this.settings.saveName(channel, name);
            return `Registered esportalname: ${name} for channel ${channel} @${tags.username}`;
        } catch (error) {
            console.error('Error on TestCommand:', error);
            return 'An error occurred while changing the font style.';
        }
    }
}

module.exports = EsportalName;
