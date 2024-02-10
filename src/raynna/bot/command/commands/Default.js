const {getData, RequestType} = require("../../requests/Request");
const Settings = require("../../settings/Settings");
const { checkBannedPlayer, getDefaultWithGameType} = require('../CommandUtils');

class Default {

    constructor() {
        this.moderator = true;
        this.name = 'Default';
        this.settings = new Settings();
    }

    async execute(tags, channel, argument, client, isBotModerator) {
        try {
            const { DefaultName: defaultName, GameType: gameType, Message: message} = await getDefaultWithGameType(channel, argument, this.settings);
            if (message) {
                return message;
            }
            const { data: userData, errorMessage: userError } = await getData(RequestType.UserData, defaultName);
            if (userError) {
                return userError;
            }
            const isBanned = await checkBannedPlayer(userData, isBotModerator);
            if (isBanned) {
                return isBanned;
            }
            const { username, id, game_stats } = userData;

            return ``;
        } catch (error) {
            console.log(`An error has occured while executing command ${this.name}`);
        }
    }
}

module.exports = Default;