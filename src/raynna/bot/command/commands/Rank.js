const {getData, RequestType} = require("../../requests/Request");
const Settings = require("../../settings/Settings");
const { calculateRankAndPlacement } = require('../../utils/RankUtils');
const { getGamesData } = require('../../utils/GamesUtils');
const { checkBannedPlayer, getDefaultWithGameType} = require('../CommandUtils');

class Rank {

    constructor() {
        this.name = 'Rank';
        this.settings = new Settings();
    }

    async execute(tags, channel, argument, client, isBotModerator) {
        try {
            const { DefaultName: name, GameType: gameType, Message: message} = await getDefaultWithGameType(channel, argument, this.settings);
            if (message) {
                return message;
            }
            const { data: userData, errorMessage: userError } = await getData(RequestType.UserData, name);
            if (userError) {
                return userError;
            }
            const isBanned = await checkBannedPlayer(userData, isBotModerator);
            if (isBanned) {
                return isBanned;
            }
            const { id, username, game_stats } = userData;
            const gamesData = await getGamesData(id, "daily");

            const totalGamesPlayedToday = gamesData.length;
            const eloChanges = gamesData.map(match => match.elo_change).filter(eloChange => eloChange !== undefined);
            const totalEloChange = eloChanges.reduce((sum, eloChange) => sum + eloChange, 0);
            const gameStats = game_stats[gameType];
            const { elo } = gameStats;
            const gameTypeName = gameType === 0 ? 'CS:GO' : 'CS2';
            const { rank, placement } = calculateRankAndPlacement(userData, gameType);
            let resultString = `${username}'s Esportal: ${gameTypeName} Rank: ${rank} (Rating: ${elo})`;
            if (totalGamesPlayedToday > 0 && gameType === 2) {
                resultString += `, Today: `;
                if (totalEloChange > 0) {
                    resultString += `+`;
                }
                resultString += totalEloChange.toString();
            }
            if (gameType === 2) {
                resultString += `, ${placement}`;
            }
            return resultString;
        } catch (error) {
            console.error("An error has occured while executing command Rank");
        }
    }
}

module.exports = Rank;