const {getData, RequestType} = require("../../requests/Request");
const Settings = require("../../settings/Settings");
const { checkBannedPlayer, getDefault} = require('../CommandUtils');

class Esportal {

    constructor() {
        this.name = 'Esportal';
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
            const { username, id, game_stats } = userData;
            let response = ``;
            const isBanned = await checkBannedPlayer(userData, isBotModerator);
            if (isBanned) {
                return isBanned;
            }
            if (isBotModerator) {
                response = `https://esportal.com/sv/profile/${userData.username}`;
            } else {
                response = `Esportal name: ${userData.username}`;
            }
            response += ` @${tags.username}`;
            return response;
        } catch (error) {
            console.log(`An error has occured while executing command ${this.name}`);
        }
    }
}

module.exports = Esportal;