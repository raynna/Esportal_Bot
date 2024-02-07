const {getData, RequestType} = require("../requests/Request");


async function checkBannedPlayer(userData) {
    try {
        const {username: esportalName, banned: banned, ban: ban} = userData;
        if (banned === true) {
            let reason = 'None';
            if (ban !== null) {
                reason = ban.reason;
            }
            if (reason !== `Chat abuse`) {
                return `${esportalName} is banned from playing Esportal. -> Reason: ${reason}!`;
            }
        }
        return null;
    } catch (error) {
        console.error(error);
    }
}

async function getDefault(channel, argument, settings) {
    try {
        let name = argument;
        if (!name) {
            const channelWithoutHash = channel.startsWith('#') ? channel.replace('#', '').toLowerCase() : channel.toLowerCase();
            const {data: twitch, errorMessage: message} = await getData(RequestType.TwitchUser, channelWithoutHash);
            if (message) {
                return {DefaultName: null, Message: message};
            }
            const {id: twitchId} = twitch.data[0];
            await settings.check(twitchId);
            name = await settings.check(twitchId);
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
        let name = argument;
        let gameType = 2;
        if (!name) {
            const channelWithoutHash = channel.startsWith('#') ? channel.replace('#', '').toLowerCase() : channel.toLowerCase();
            const {data: twitch, errorMessage: message} = await getData(RequestType.TwitchUser, channelWithoutHash);
            if (message) {
                return {DefaultName: null, GameType: null, Message: message};
            }
            const {id: twitchId} = twitch.data[0];
            await settings.check(twitchId);
            const argumentParts = argument ? argument.split(' ') : [];
            if (argumentParts.includes('csgo')) {
                gameType = 0;
                const nameIndex = argumentParts.indexOf('csgo');
                argumentParts.splice(nameIndex, 1);
            }
            const playerName = argumentParts.join(' ');
            name = playerName || await settings.getEsportalName(twitchId);
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

module.exports = {getDefaultWithGameType, getDefault, checkBannedPlayer}