const {getData, RequestType} = require("../../requests/Request");
const Settings = require("../../settings/Settings");
const { getDefault} = require('../CommandUtils');

class Premier {

    constructor() {
        this.name = 'Premier';
        this.settings = new Settings();
    }

    async execute(tags, channel, argument, client, isBotModerator) {
        try {
            const { DefaultName: name, Message: message} = await getDefault(channel, argument, this.settings);
            if (message) {
                return message;
            }
            const { data: userData, errorMessage: userError } = await getData(RequestType.UserData, name);
            if (userError) {
                return userError;
            }
            const { id, username } = userData;
            const steamId = "7656119" + (id + 7960265728);
            const { data: leetify, errorMessage: leetifyError } = await getData(RequestType.Leetify, steamId);
            if (leetifyError) {
                return leetifyError;
            }
            const { games } = leetify;
            let skillLevel;
            for (const game of games) {
                if (game == null)
                    continue;
                if (game.dataSource === `matchmaking` && game.skillLevel !== null && game.skillLevel !== 0 && game.isCs2) {
                    skillLevel = game.skillLevel;
                    break;
                }
            }
            if (!skillLevel) {
                skillLevel = `---`;
            }
            return `${username}'s Premier: Rating: ${skillLevel.toLocaleString()}`;
        } catch (error) {
            console.error(`An error has occured while executing command ${this.name}`);
        }
    }
}

module.exports = Premier;