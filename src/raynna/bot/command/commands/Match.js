const {getData, RequestType} = require("../../requests/Request");
const Settings = require("../../settings/Settings");
const { checkBannedPlayer, getDefaultWithGameType, getDefault} = require('../CommandUtils');
const {getMapName} = require("../../utils/MapUtils");

class Match {

    constructor() {
        this.name = 'Match';
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
            const { username, current_match, current_tournament_lobby } = userData;
            if (current_tournament_lobby) {
                return `${username} is currently in a Esportal Tournament, disabled information for tournaments.`;
            }
            if (current_match.id) {
                return await this.showMatch(username, current_match.id);
            }
            return `${username} is not currently playing Esportal.`;
        } catch (error) {
            console.log(`An error has occured while executing command ${this.name}`);
        }
    }

    async showMatch(username, matchId) {
        const { data: matchData, errorMessage: matchError } = await getData(RequestType.MatchData, matchId);
        if (matchError) {
            return matchError;
        }
        const { team1_score, team2_score, players, map_id } = matchData;
        let player = players.find(player => player.username.toLowerCase() === username.toLowerCase());
        const mvp = players.reduce((prev, current) => (prev.kills > current.kills) ? prev : current);
        const { kills, deaths, assists, headshots } = player;
        const streamersTeam = player ? player.team : 'N/A';
        const displayScore = streamersTeam === 1 ? `${team1_score} : ${team2_score}` : `${team2_score} : ${team1_score}`;
        const ratio = deaths !== 0 ? (kills / deaths).toFixed(2) : "N/A";
        const hsratio = headshots !== 0 ? Math.floor(headshots / kills * 100).toFixed(0) : "0";
        const mapName = await getMapName(map_id);
        let result = `${username} is playing ${mapName} (${displayScore}), Kills: ${kills}, Deaths: ${deaths}, Assists: ${assists}, HS: ${hsratio}%, K/D: ${ratio}`;
        if (mvp && mvp.kills > 0) {
            result += `, current MVP: ${mvp.username}`;
        }
        return result;
    }
}

module.exports = Match;