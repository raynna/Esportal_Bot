const {getData, RequestType} = require("../requests/Request");


async function checkBannedPlayer(userData, isModerator) {
    try {
        const {username: esportalName, banned: banned, ban: ban} = userData;
        let response = null;
        if (banned === true) {
            let reason = 'None';
            if (ban !== null) {
                reason = ban.reason;
            }
 		response = `${esportalName} is banned from playing Esportal. -> Reason: ${reason}!`
                if (isModerator) {
                    response += ` https://esportal.com/sv/profile/${esportalName}`;
                }
                return response;
            /*if (reason !== `Chat abuse`) {
                response = `${esportalName} is banned from playing Esportal. -> Reason: ${reason}!`
                if (isModerator) {
                    response += ` https://esportal.com/sv/profile/${esportalName}`;
                }
                return response;
            }*/
        }
        return response;
    } catch (error) {
        console.error(error);
    }
}

async function checkBannedFaceit(faceit, esportalName, isMod) {
    try {
        const {registration_status, nickname} = faceit;
        const isBanned = registration_status === 'banned';
        let response = `${esportalName}'s Faceit: ${nickname} is banned from playing on Faceit.`;
        if (isBanned) {
            if (isMod) {
                response += ` https://www.faceit.com/sv/players/${nickname}`;
            }
            return response;
        }
        return null;
    } catch (error) {
        console.error(error);
    }
}

async function getDefault(channel, argument, settings) {
    try {
        let name = argument ? argument.trim() : "";
        if (!name) {
            const channelWithoutHash = channel.startsWith('#') ? channel.replace('#', '').toLowerCase() : channel.toLowerCase();
            const {data: twitch, errorMessage: message} = await getData(RequestType.TwitchUser, channelWithoutHash);
            if (message) {
                return {DefaultName: null, Message: message};
            }
            const {id: twitchId} = twitch.data[0];
            await settings.check(twitchId);
            name = await settings.getEsportalName(twitchId);
        }
        if (!name) {
            return {
                DefaultName: null,
                Message: `Streamer need to register an Esportal name -> !esportalname name @${channel.slice(1)}`
            };
        }
        return {DefaultName: name, Message: ''};
    } catch (error) {
        console.error(error);
    }
}

async function getDefaultWithGameType(channel, argument, settings) {
    try {
        let name = argument ? argument.trim() : "";
        let gameType = 2;
        const argumentParts = argument ? argument.split(' ') : [];
        if (argumentParts.includes('csgo')) {
            gameType = 0;
            const nameIndex = argumentParts.indexOf('csgo');
            argumentParts.splice(nameIndex, 1);
            name = argumentParts.join(' ');
        }
        if (!name) {
            const channelWithoutHash = channel.startsWith('#') ? channel.replace('#', '').toLowerCase() : channel.toLowerCase();
            const {data: twitch, errorMessage: message} = await getData(RequestType.TwitchUser, channelWithoutHash);
            if (message) {
                return {DefaultName: null, GameType: null, Message: message};
            }
            const {id: twitchId} = twitch.data[0];
            await settings.check(twitchId);
            name = await settings.getEsportalName(twitchId);
        }
        if (!name) {
            return {
                DefaultName: null,
                GameType: null,
                Message: `Streamer need to register an Esportal name -> !esportalname name @${channel.slice(1)}`
            };
        }
        return {DefaultName: name, GameType: gameType, Message: ''};
    } catch (error) {
        console.error(error);
    }
}

module.exports = {getDefaultWithGameType, getDefault, checkBannedPlayer, checkBannedFaceit}