const {getData, RequestType} = require("../../requests/Request");
const Settings = require("../../settings/Settings");
const { getDefault, checkBannedFaceit} = require('../CommandUtils');
const { COUNTRY_CODES } = require('../../utils/CountryUtils');

class Faceit {

    constructor() {
        this.name = 'Faceit';
        this.settings = new Settings();
    }

    async execute(tags, channel, argument, client, isBotModerator) {
        try {
            const { DefaultName: name,  Message: message} = await getDefault(channel, argument, this.settings);
            if (message) {
                return message;
            }
            const { data: userData, errorMessage: userError } = await getData(RequestType.UserData, name);
            if (userError) {
                return userError;
            }
            const { id, username } = userData;
            const steamId = "7656119" + (id + 7960265728);
            const { data: faceitFinder, errorMessage: faceitFinderError} = await getData(RequestType.FaceitFinder, steamId);
            if (faceitFinderError) {
                return faceitFinderError;
            }
            const { data: faceitData, errorMessage: faceitError } = await getData(RequestType.FaceItData, faceitFinder);
            if (faceitError) {
                return faceitError;
            }
            const faceit = faceitData.payload;
            const { nickname, games, country } = faceit;
            const isBanned = await checkBannedFaceit(faceit, username, isBotModerator);
            if (isBanned) {
                return isBanned;
            }
            let response = '';
            if (!games) {
                response = `${username}'s Faceit: ${nickname} hasn't registered any games on Faceit.`;
                if (isBotModerator) {
                    response += ` https://www.faceit.com/sv/players/${nickname}`;
                }
                return response;
            }
            if (!games.cs2) {
                response = `${username}'s Faceit: ${nickname} hasn't played any Counter-Strike 2 on Faceit.`;
                if (isBotModerator) {
                    response += ` https://www.faceit.com/sv/players/${nickname}`;
                }
                return response;
            }
            const { faceit_elo, skill_level } = games.cs2;
            response = `${username}'s Faceit: ${nickname}, Elo: ${faceit_elo}, Level: ${skill_level}, Country: ${COUNTRY_CODES[country] || 'Unknown'}`;
            if (isBotModerator) {
                response += ` https://www.faceit.com/sv/players/${nickname}`;
            }
            return response;
        } catch (error) {
            console.log(`An error has occurred while executing command ${this.name}`, error);
        }
    }
}

module.exports = Faceit;