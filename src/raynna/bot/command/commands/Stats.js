const {getData, RequestType} = require("../../requests/Request");
const Settings = require("../../settings/Settings");
const { calculateRankAndPlacement } = require('../../utils/RankUtils');
const { checkBannedPlayer, getDefaultWithGameType} = require('../CommandUtils');

class Stats {

    constructor() {
        this.name = 'Stats';
        this.settings = new Settings();
    }

    async execute(tags, channel, argument, client) {
        try {
            const { DefaultName: defaultName, GameType: gameType, Message: message} = await getDefaultWithGameType(channel, argument, this.settings);
            if (message) {
                return message;
            }
            const { data: userData, errorMessage: userError } = await getData(RequestType.UserData, defaultName);
            if (userError) {
                return userError;
            }
            const isBanned = await checkBannedPlayer(userData);
            if (isBanned) {
                return isBanned;
            }
            const { username, game_stats } = userData;
            const gameStats = game_stats[gameType];
            const { extra, kills, deaths, wins, losses, } = gameStats;
            const { entry_attempts, entry_kills } = extra;

            const gamesPlayed = wins + losses;

            const entryRatio = entry_attempts !== 0 ? ((entry_kills / entry_attempts) * 100).toFixed(2) : 0;
            const ratio = deaths !== 0 ? (kills / deaths).toFixed(2) : "N/A";

            const gameTypeName = gameType === 0 ? 'CS:GO' : 'CS2';
            const { rank } = calculateRankAndPlacement(userData, gameType);

            return `${username}'s stats for ${gameTypeName}, Rank: ${rank}, Games Played: ${gamesPlayed}, K/D: ${ratio}, Entry frags: ${entry_kills} (${entryRatio}%)`;
        } catch (error) {
            console.log("An error has occured while executing command Stats");
        }
    }
}

module.exports = Stats;