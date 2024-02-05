
const Settings = require('../Settings');
const request = require('../Request');

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
            const { data: userData, errorMessage: error } = await request.getData(request.RequestType.UserData, name);
            if (error) {
                return error;
            }
            const username = userData.username;
            const id = userData.id;
            this.settings.saveName(channel, username);
            this.settings.saveEsportalId(channel, id);
            return `Registered esportalname: ${name} for channel ${channel} @${tags.username}`;
        } catch (error) {
            console.error('Error on TestCommand:', error);
            return 'An error occurred while changing the font style.';
        }
    }
}

module.exports = EsportalName;
