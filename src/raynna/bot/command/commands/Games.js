const {getData, RequestType} = require("../../requests/Request");
const Settings = require("../../settings/Settings");
const { checkBannedPlayer, getDefault} = require('../CommandUtils');
const {getGamesData} = require("../../utils/GamesUtils");

class Games {

    constructor() {
        this.name = 'Games';
        this.triggers = ["totalgames"];
        this.settings = new Settings();
    }

    async execute(tags, channel, argument, client, isBotModerator) {
        try {
            const { DefaultName: defaultName,  Message: message} = await getDefault(channel, argument, this.settings);
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
            const { wins: csgoWins, losses: csgoLosses } = game_stats[0];
            const { wins: cs2Wins, losses: cs2Losses } = game_stats[2];
            const csgoGames = csgoWins + csgoLosses;
            const cs2Games = cs2Wins + cs2Losses;
            const todayData = await getGamesData(id, "daily");
            let gamesToday = 0;
            if (todayData && todayData.length > 0) {
                gamesToday = todayData.length;
            }
            const eloChanges = todayData.map(match => match.elo_change).filter(eloChange => eloChange !== undefined);
            const totalEloChange = eloChanges.reduce((sum, eloChange) => sum + eloChange, 0);
            let result = `${username}'s games played:`;
            if (cs2Games > 0) {
                result += ` CS2: ${cs2Games.toLocaleString()},`;
            }
            if (csgoGames > 0) {
                result += ` CS:GO: ${csgoGames.toLocaleString()},`;
            }
            result += ` Total: ${cs2Games+csgoGames},`;
            result += ` Today: ${gamesToday === 0 ? `None` : gamesToday.toLocaleString()}`;
            if (gamesToday > 0) {
                result += `, Rating today: ${totalEloChange > 0 ? '+' : ''}${totalEloChange.toLocaleString()}`;
            }
            return result;
        } catch (error) {
            console.log(`An error has occured while executing command ${this.name}`);
        }
    }
}

module.exports = Games;