const {getData, RequestType} = require("../../requests/Request");
const Settings = require("../../settings/Settings");
const { getDefault, checkBannedFaceit} = require('../CommandUtils');
const { COUNTRY_CODES } = require('../../utils/CountryUtils');

class Faceitstats {

    constructor() {
        this.name = 'Faceitstats';
        this.triggers = ['fstats', 'faceitstat'];
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
            const faceitId = faceit.id;
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
            const { data: faceitStats, errorMessage: faceitStatsError } = await getData(RequestType.FaceItStats, faceitId);
            if (faceitStatsError) {
                return faceitStatsError;
            }
            const stats = faceitStats.lifetime;

            const matches = stats.m1;
            const winrate = stats.k6;
            const hsrate = stats.k8;
            const headshots = stats.m13;
            const kd = stats.k5;
            const totalKills = (headshots / (hsrate / 100)).toLocaleString(undefined, { maximumFractionDigits: 0 });
            response = `${username}'s Faceit: ${nickname}, Level: ${skill_level} (Elo: ${faceit_elo.toLocaleString()}), Stats: K/D: ${kd}, Matches: ${matches.toLocaleString()}, Kills: ${totalKills}, Winrate: ${winrate}%, Headshots: ${hsrate}%`;

            if (isBotModerator) {
                response += ` https://www.faceit.com/sv/players/${nickname}`;
            }
            return response;
        } catch (error) {
            console.log(`An error has occurred while executing command ${this.name}`, error);
        }
    }
}

module.exports = Faceitstats;