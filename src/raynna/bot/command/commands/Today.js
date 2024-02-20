
const Settings = require('../../settings/Settings');
const {getData, RequestType} = require('../../requests/Request');

const { getGamesData } = require("../../utils/GamesUtils");
const {checkBannedPlayer} = require("../CommandUtils");
const {getMapName} = require("../../utils/MapUtils");

class Today {
    constructor() {
        this.name = 'Today';
        this.triggers = ['idag'];
        this.settings = new Settings();
    }

    async execute(tags, channel, argument, client, isBotModerator) {
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
            const { id: esportalId, username: esportalName, current_match } = userData;
            const isBanned = await checkBannedPlayer(userData, isBotModerator);
            if (isBanned) {
                return isBanned;
            }
            const gamesData = await getGamesData(esportalId, "daily");

            if (!gamesData || gamesData.length === 0) {
                if (current_match.id) {
                    return this.showMatch(esportalName, current_match.id);
                }
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
                return `${esportalName} has not played any games today. Last played: ${formattedDate}`;
            }

            const eloChanges = gamesData.map(match => match.elo_change).filter(eloChange => eloChange !== undefined);
            const kills = gamesData.map(match => match.kills).filter(kills => kills !== undefined);
            const deaths = gamesData.map(match => match.deaths).filter(deaths => deaths !== undefined);
            const totalGames = gamesData.length;
            const totalKills = kills.reduce((sum, kill) => sum + kill, 0);
            const totalDeaths = deaths.reduce((sum, death) => sum + death, 0);
            const ratio = deaths !== 0 ? (totalKills / totalDeaths).toFixed(2) : "N/A";
            const totalEloChange = eloChanges.reduce((sum, eloChange) => sum + eloChange, 0);
            return `${esportalName}'s stats today: Games: ${totalGames}, Rating: ${totalEloChange > 0 ? '+' : ''}${totalEloChange}, Kills: ${totalKills}, Deaths: ${totalDeaths}, K/D: ${ratio}`;
        } catch (error) {
            console.log(`An error has occurred while executing command ${this.name}`, error);
        }
    }

    async showMatch(username, matchId) {
        try {
            const {data: matchData, errorMessage: matchError} = await getData(RequestType.MatchData, matchId);
            if (matchError) {
                return matchError;
            }

            const {team1_score, team2_score, players, map_id} = matchData;
            const player = players.find(player => player.username.toLowerCase() === username.toLowerCase());
            const streamersTeam = player ? player.team : 'N/A';
            const displayScore = streamersTeam === 1 ? `${team1_score} : ${team2_score}` : `${team2_score} : ${team1_score}`;
            const mapName = await getMapName(map_id);
            return `${username} is playing the first game for today: ${mapName}, Score: ${displayScore}, -> use !match for more information.`;
        } catch (error) {
            console.log(error);
        }
    }
}

module.exports = Today;
