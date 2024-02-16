const {getData, RequestType} = require("../../requests/Request");
const Settings = require("../../settings/Settings");
const { checkBannedPlayer, getDefault} = require('../CommandUtils');
const {getMapName} = require("../../utils/MapUtils");

class Gather {

    constructor() {
        this.name = 'Gather';
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
            const { username, current_gather_id, current_match } = userData;
            if (current_gather_id) {
                return await this.showGatherLobby(username, current_gather_id, isBotModerator);
            }
            if (current_match.id) {
                return await this.showMatch(username, current_match.id);
            }
            return `${username} is not currently playing Esportal.`;
        } catch (error) {
            console.log(`An error has occurred while executing command ${this.name}`, error);
        }
    }

    async showGatherLobby(username, gatherId, isBotModerator) {
        try {
        const { data: gatherList, errorMessage: errorMessage } = await getData(RequestType.GatherList);
        if (errorMessage) {
            return errorMessage;
        }
        const gather = gatherList.find(gather => gather.id === gatherId);
        if (!gather) {
            return `Error finding gather from list.`;
        }
        const { picked_players, players, map_id } = gather;
        const waiting = players.length - picked_players;
        const mapName = await getMapName(map_id);
        if (isBotModerator) {
            return `${username} is in gather: https://www.esportal.com/sv/gather/${gatherId} ${mapName}, Waiting: ${waiting}, Picked: ${picked_players}/10`;
        }
        return `${username} is in a gather lobby, ${mapName}, Waiting: ${waiting}, Picked: ${picked_players}/10`;
        } catch (error) {
            console.log(error);
        }
    }


    async showMatch(username, matchId) {
        try {
            const {data: matchData, errorMessage: matchError} = await getData(RequestType.MatchData, matchId);
            if (matchError) {
                return matchError;
            }

            if (matchData.tournament_id) {
                return `${username} is currently playing in tournament.`;
            }

            const {team1_score, team2_score, players, map_id} = matchData;
            const player = players.find(player => player.username.toLowerCase() === username.toLowerCase());
            const streamersTeam = player ? player.team : 'N/A';
            const displayScore = streamersTeam === 1 ? `${team1_score} : ${team2_score}` : `${team2_score} : ${team1_score}`;
            const mapName = await getMapName(map_id);

            return `${username} is in a match: ${mapName}, Score: ${displayScore}, -> use !match for more information.`;
        } catch (error) {
            console.log(error);
        }
    }
}

module.exports = Gather;