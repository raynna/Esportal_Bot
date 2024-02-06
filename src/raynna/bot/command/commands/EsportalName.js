
const Settings = require('../../Settings');
const {getData, RequestType} = require('../../requests/Request');

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
            const { data: userData, errorMessage: error } = await getData(RequestType.UserData, name);
            if (error) {
                return error;
            }
            const username = userData.username;
            const id = userData.id;
            if (this.settings.settings.hasOwnProperty(channel)) {
                if (this.settings.settings[channel].esportal.name.toLowerCase() === username.toLowerCase()) {
                    return `Esportal Name: ${username} is already registered on this channel.`;
                }
            }
            for (const registeredChannel in this.settings.settings) {
                if (this.settings.settings.hasOwnProperty(registeredChannel)) {
                    const registeredSettings = this.settings.settings[registeredChannel];
                    if (registeredSettings.esportal && registeredSettings.esportal.name.toLowerCase() === username.toLowerCase()) {
                        return `Esportal Name: ${username} is already registered for channel ${registeredChannel}.`;
                    }
                }
            }
            this.settings.saveName(channel, username);
            this.settings.saveEsportalId(channel, id);
            return `Registered Esportal Name: ${username} for channel ${channel}`;
        } catch (error) {
            console.error('Error on EsportalName Command:', error);
            return 'An error occurred while registering Esportal Name.';
        }
    }
}

module.exports = EsportalName;
