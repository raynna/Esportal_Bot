
const Settings = require('../../settings/Settings');
const {getData, RequestType} = require('../../requests/Request');

const { getGamesData } = require("../../utils/GamesUtils");
const {checkBannedPlayer} = require("../CommandUtils");

class Month {
    constructor() {
        this.name = 'Month';
        this.triggers = ['månad'];
        this.settings = new Settings();
    }

    async execute(tags, channel, argument, client, isBotModerator) {
        return `This command is currently disabled`;
        try {
            const channelWithoutHash = channel.startsWith('#') ? channel.replace('#', '').toLowerCase() : channel.toLowerCase();
            const { data: twitch, errorMessage: twitchError } = await getData(RequestType.TwitchUser, channelWithoutHash);
            if (twitchError) {
                return twitchError;
            }
            const { id: twitchId } = twitch.data[0];
            await this.settings.check(twitchId);
            const name = argument ? argument.trim() : await this.settings.getEsportalName(twitchId);
            if (!name) {
                return `Streamer need to register an Esportal name -> !esportalname name @${channel.slice(1)}`;
            }
            const { data: userData, errorMessage: error } = await getData(RequestType.UserData, name);
            if (error) {
                return error;
            }
            const { id: esportalId, username: esportalName } = userData;
            const isBanned = await checkBannedPlayer(userData, isBotModerator);
            if (isBanned) {
                return isBanned;
            }
            const gamesData = await getGamesData(esportalId, "monthly");

            if (!gamesData || gamesData.length === 0) {
                const recentGamesData = await getData(RequestType.RecentMatches, esportalId);
                if (recentGamesData.errorMessage) {
                    return recentGamesData.errorMessage;
                }
                const recentGames = recentGamesData.data;
                const mostRecent = recentGames[0];
                const mostRecentDate = new Date(mostRecent.inserted * 1000);
                const day = mostRecentDate.getDate().toString().padStart(2, '0');
                const month = (mostRecentDate.getMonth() + 1).toString().padStart(2, '0');
                const year = mostRecentDate.getFullYear();
                const formattedDate = `${day}/${month}-${year}`;
                return `${esportalName} has not played any games within 30 days. Last played: ${formattedDate}`;
            }

            const eloChanges = gamesData.map(match => match.elo_change).filter(eloChange => eloChange !== undefined);
            const kills = gamesData.map(match => match.kills).filter(kills => kills !== undefined);
            const deaths = gamesData.map(match => match.deaths).filter(deaths => deaths !== undefined);
            const totalGames = gamesData.length;
            const totalKills = kills.reduce((sum, kill) => sum + kill, 0);
            const totalDeaths = deaths.reduce((sum, death) => sum + death, 0);
            const ratio = deaths !== 0 ? (totalKills / totalDeaths).toFixed(2) : "N/A";
            const totalEloChange = eloChanges.reduce((sum, eloChange) => sum + eloChange, 0);
            return `${esportalName}'s stats latest 30 days: Games: ${totalGames}, Rating: ${totalEloChange > 0 ? '+' : ''}${totalEloChange}, Kills: ${totalKills}, Deaths: ${totalDeaths}, K/D: ${ratio}`;
        } catch (error) {
            console.log(`An error has occurred while executing command ${this.name}`, error);
        }
    }
}

module.exports = Month;
