const {getData, RequestType} = require("../../requests/Request");
const Settings = require("../../settings/Settings");
const { calculateRankAndPlacement } = require('../../utils/RankUtils');
const { getGamesData } = require('../../utils/GamesUtils');

class Rank {

    constructor() {
        this.name = 'Rank';
        this.settings = new Settings();
    }

    async execute(tags, channel, argument, client) {
        try {
            const channelWithoutHash = channel.startsWith('#') ? channel.replace('#', '').toLowerCase() : channel.toLowerCase();
            const { data: twitch, errorMessage: twitchError } = await getData(RequestType.TwitchUser, channelWithoutHash);
            if (twitchError) {
                return twitchError;
            }
            const { id: twitchId } = twitch.data[0];
            await this.settings.check(twitchId);
            let gameType = 2;
            let name;
            const argumentParts = argument ? argument.split(' ') : [];
            if (argumentParts.includes('csgo')) {
                gameType = 0;
                const nameIndex = argumentParts.indexOf('csgo');
                argumentParts.splice(nameIndex, 1);
            }
            const playerName = argumentParts.join(' ');
            name = playerName ||  await this.settings.getEsportalName(twitchId);
            if (!name) {
                return `Streamer need to register an Esportal name -> !esportalname name @${channel.slice(1)}`;
            }
            const { data: userData, errorMessage: userError } = await getData(RequestType.UserData, name);
            if (userError) {
                return userError;
            }
            const { id: esportalId, username: esportalName, banned: banned, ban: ban, game_stats } = userData;

            if (banned === true) {
                let reason = 'None';
                if (ban !== null) {
                    reason = ban.reason;
                }
                if (reason !== `Chat abuse`) {
                    return `${esportalName} is banned from playing Esportal. -> Reason: ${reason}!`;
                }
            }
            const gamesData = await getGamesData(esportalId, "daily");

            const totalGamesPlayedToday = gamesData.length;
            const eloChanges = gamesData.map(match => match.elo_change).filter(eloChange => eloChange !== undefined);
            const totalEloChange = eloChanges.reduce((sum, eloChange) => sum + eloChange, 0);
            const gameStats = game_stats[gameType];
            const rating = gameStats.elo;
            const gameTypeName = gameType === 0 ? 'CS:GO' : 'CS2';
            const { rank, placement } = calculateRankAndPlacement(userData, gameType);
            let resultString = `${esportalName}'s Esportal: ${gameTypeName} Rank: ${rank} (Rating: ${rating})`;
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
            console.log("An error has occured while executing command Rank");
        }
    }
}

module.exports = Rank;