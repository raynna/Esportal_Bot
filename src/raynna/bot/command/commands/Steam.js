const {getData, RequestType} = require("../../requests/Request");
const Settings = require("../../settings/Settings");
const {getDefault} = require("../CommandUtils");

class Steam {

    constructor() {
        this.name = 'Steam';
        this.settings = new Settings();
    }

    async execute(tags, channel, argument, client, isBotModerator) {
        try {
            const { DefaultName: defaultName, Message: message} = await getDefault(channel, argument, this.settings);
            if (message) {
                return message;
            }
            const { data: userData, errorMessage: userError } = await getData(RequestType.UserData, defaultName);
            if (userError) {
                return userError;
            }
            const { username, id } = userData;
            const steamId = "7656119" + (id + 7960265728);
            console.log(`Esportal profile: https://esportal.com/sv/profile/${username}`);
            console.log(`Steam profile: https://steamcommunity.com/profiles/${steamId}`);
            let response = `${username}'s `;
            if (isBotModerator) {
                response += `Steam: https://www.steamcommunity.com/profiles/${steamId}`;
            } else {
                response += `SteamId: ${steamId}`;
            }
            return response;
        } catch (error) {
            console.log(`An error has occurred while executing command ${this.name}`, error);
        }
    }
}

module.exports = Steam;