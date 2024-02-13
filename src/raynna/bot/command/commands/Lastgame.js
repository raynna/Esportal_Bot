const {getData, RequestType} = require("../../requests/Request");
const Settings = require("../../settings/Settings");
const { checkBannedPlayer, getDefault} = require('../CommandUtils');
const {getMapName} = require("../../utils/MapUtils");

class Lastgame {

    constructor() {
        this.name = 'Lastgame';
        this.triggers = ["previousgame"];
        this.settings = new Settings();
    }

    async execute(tags, channel, argument, client, isBotModerator) {
        try {
            const { DefaultName: defaultName, Message: message} = await getDefault(channel, argument, this.settings);
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
            const { data: recentGame, errorMessage: recentError} = await getData(RequestType.RecentMatches, id);
            if (recentError) {
                return recentError;
            }
            const mostRecent = recentGame[0];
            const { winner, map_id, inserted } = mostRecent;
            const { kills, deaths, assists, headshots } = mostRecent.stats;
            const { team1_score, team2_score } = mostRecent.info;
            const playersTeam = winner && team1_score > team2_score ? 1 : winner && team2_score > team1_score ? 2 : !winner && team1_score > team2_score ? 2 : 1;
            const displayScore = playersTeam === 1 ? `${team1_score} : ${team2_score}` : `${team2_score} : ${team1_score}`;
            const ratio = deaths !== 0 ? (kills / deaths).toFixed(2) : "N/A";
            const hsRatio = headshots !== 0 ? Math.floor(headshots / kills * 100).toFixed(0) : "0";
            const mapName = await getMapName(map_id);
            const mostRecentDate = new Date(inserted * 1000);
            const day = mostRecentDate.getDate().toString().padStart(2, '0');
            const month = (mostRecentDate.getMonth() + 1).toString().padStart(2, '0');
            const year = mostRecentDate.getFullYear();
            const formattedDate = `${day}/${month}-${year}`;
            return `${username}'s previous game: ${mapName} (${displayScore}), Kills: ${kills}, Deaths: ${deaths}, Assists: ${assists}, HS: ${hsRatio}%, K/D: ${ratio}, Played: ${formattedDate}`;
        } catch (error) {
            console.log(`An error has occured while executing command ${this.name}`);
        }
    }
}

module.exports = Lastgame;