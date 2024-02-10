
const Settings = require('../../settings/Settings');
const {getData, RequestType} = require('../../requests/Request');

class EsportalName {
    constructor() {
        this.moderator = true;
        this.name = 'Esportalname';
        this.triggers = ['register'];
        this.settings = new Settings();
    }

    async execute(tags, channel, argument, client, isBotModerator) {
        try {
            const name = argument ? argument.trim() : "";
            if (!name) {
                return `Please provide a username, usage; -> !esportalname name`;
            }
            const { data: userData, errorMessage: error } = await getData(RequestType.UserData, name);
            if (error) {
                return error;
            }
            const { id: esportalId, username: esportalName } = userData;

            const channelWithoutHash = channel.startsWith('#') ? channel.replace('#', '').toLowerCase() : channel.toLowerCase();
            const { data: twitch, errorMessage: twitchError } = await getData(RequestType.TwitchUser, channelWithoutHash);
            if (twitchError) {
                return twitchError;
            }
            const { id: twitchId } = twitch.data[0];
            await this.settings.check(twitchId);
            if (this.settings.savedSettings.hasOwnProperty(twitchId)) {
                if (this.settings.savedSettings[twitchId].esportal.name.toLowerCase() === esportalName.toLowerCase()) {
                    return `Esportal Name: ${esportalName} is already registered on this channel.`;
                }
            }
            for (const registeredChannel in this.settings.savedSettings) {
                if (this.settings.savedSettings.hasOwnProperty(registeredChannel)) {
                    const registeredSettings = this.settings.savedSettings[registeredChannel];
                    if (registeredSettings.esportal && registeredSettings.esportal.name.toLowerCase() === esportalName.toLowerCase()) {
                        return `Esportal Name: ${esportalName} is already registered for channel ${this.settings.savedSettings[registeredChannel].twitch.channel}.`;
                    }
                }
            }
            await this.settings.saveEsportal(twitchId, esportalName, esportalId);
            return `Registered/updated Esportal Name: ${esportalName} for channel ${channel}`;
        } catch (error) {
            console.log(`An error has occured while executing command ${this.name}`);
        }
    }
}

module.exports = EsportalName;
