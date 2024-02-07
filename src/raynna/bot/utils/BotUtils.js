require('dotenv').config();
axios = require('axios');

const Settings = require('../settings/Settings');
const settings = new Settings();

const {getData, RequestType} = require('../requests/Request');
const request = require('../requests/Request');

const {getFontStyle} = require('./Fonts');
const {getMapName} = require("./MapUtils");

let currentMatch = {player: null, matchId: null};

async function checkMatches(client, connectedChannels) {
    settings.savedSettings = await settings.loadSettings();
    for (const connected of connectedChannels) {
        const channelEntry = Object.values(settings.savedSettings).find(entry => entry.twitch.channel === connected);
        let esportalName = null;
        if (channelEntry) {
            esportalName = channelEntry.esportal.name;
        }
        const {data: userData, errorMessage: userError} = await getData(RequestType.UserData, esportalName);
        if (userError) {
            continue;
        }
        const {current_match, username} = userData;
        console.log(`currentMatch: ${current_match.id} for user: ${username}`);
        if (current_match.id === null && currentMatch[username]) {
            await sendMessage(client, connected, await showCompletedMatch(userData, currentMatch[username]));
            currentMatch[username] = null;
            continue;
        }
        currentMatch[username] = current_match.id;
        console.log(`currentMatch[username]: ${JSON.stringify(currentMatch[username])}`);
    }
}

async function showCompletedMatch(userData, matchId) {
    const {data: matchData, errorMessage: matchError} = await getData(RequestType.MatchData, matchId);
    if (matchError) {
        return;
    }
    const {username} = userData.data;
    const {team1_score, team2_score, players, map_id} = matchData.data;
    let player = players.find(player => player.username.toLowerCase() === username.toLowerCase());
    const mvp = players.reduce((prev, current) => (prev.kills > current.kills) ? prev : current);
    const {kills, deaths, assists, headshots} = player;
    const streamersTeam = player ? player.team : 'N/A';
    const won = streamersTeam === 1 ? team1_score > team2_score : team2_score > team1_score;
    const displayScore = streamersTeam === 1 ? `${team1_score} : ${team2_score}` : `${team2_score} : ${team1_score}`;
    const matchResult = won ? "WON" : "LOST";
    const ratio = deaths !== 0 ? (kills / deaths).toFixed(2) : "N/A";
    const hsratio = headshots !== 0 ? Math.floor(headshots / kills * 100).toFixed(0) : "0";
    const mapName = await getMapName(map_id);
    if (team1_score === 0 && team2_score === 0) {
        return `${userData.username}'s match was just cancelled.`;
    }
    return `${userData.username} just ${matchResult} a match: ${mapName} (${displayScore}), Kills: ${kills}, Deaths: ${deaths}, Assists: ${assists}, HS: ${hsratio}%, K/D: ${ratio}, MVP: ${mvp}`;
}

function findChangedGames(previous, current) {
    return current.filter((game) => !previous.some((prevGame) => prevGame.id === game.id));
}

async function showGatherLobby(userData, gatherId, channel, client) {
    const {data: gatherList, errorMessage: errorMessage} = await getData(RequestType.GatherList);
    if (errorMessage) {
        return;
    }
    const gather = gatherList.find(gather => gather.id === gatherId);
    if (!gather) {
        return;
    }
    const {data: gatherData, errorMessage: gatherError} = await getData(RequestType.GatherData, gatherId);
    if (gatherError) {
        return;
    }
    const {players} = gatherData;
    const {picked_players, map_id} = gather;
    const waiting = players.length - picked_players;
    const mapName = await getMapName(map_id);

    const isModerator = await isBotModerator(client, channel);
    if (isModerator) {
        return `${userData.username} started a gather: https://www.esportal.com/sv/gather/${gatherId} ${mapName}, Waiting: ${waiting}, Picked: ${picked_players}/10`;
    }
    return `${userData.username} started a gather lobby, ${mapName}, Waiting: ${waiting}, Picked: ${picked_players}/10`;
}

async function addChannel(channel) {
    const channelWithoutHash = channel.startsWith('#') ? channel.replace('#', '').toLowerCase() : channel.toLowerCase();
    const {data: twitch, errorMessage: error} = await getData(RequestType.TwitchUser, channelWithoutHash);
    if (error) {
        console.log(error);
        return error;
    }
    if (!twitch.data || twitch.data.length === 0) {
        return `Something went from getting this twitch, no data`;
    }
    const {id: id, login: login, display_name: username} = twitch.data[0];
    settings.savedSettings = await settings.loadSettings();
    if (settings.savedSettings[id] && settings.savedSettings[id].twitch.channel) {
        console.log(`Twitch channel ${settings.savedSettings[id].twitch.channel} is already registered on the bot.`);
        return `Twitch channel ${settings.savedSettings[id].twitch.channel} is already registered on the bot.`;
    }
    await settings.save(id, login, username);
    console.log(`Bot registered on channel: ${login} (id: ${id}).`);
    return `Bot registered on channel: ${login} (id: ${id}).`;
}

async function isBotModerator(client, channel) {
    try {
        return client.isMod(channel, process.env.TWITCH_BOT_USERNAME);
    } catch (error) {
        console.error('Error:', error);
        return false;
    }
}

async function changeFont(text, channel) {
    const styleMap = await getFontStyle(channel, settings);
    let isLink = false;
    let isTag = false;
    return text.split('').map((char, index) => {
        if (text.length - 1 === index && (char === ' ' || char === '\n')) {
            return '';
        } else if ((char === ' ' || char === '\t' || char === '\n') && (isLink || isTag)) {
            isLink = false;
            isTag = false;
        } else if (text.substring(index).startsWith('https://') && !isLink) {
            isLink = true;
        } else if (char === '@' && !isLink) {
            isTag = true;
        }
        return (isLink || isTag) ? char : (styleMap[char] || char);
    }).join('');
}

async function sendMessage(client, channel, message) {
    try {
        console.log(`bot message: ${message}`);
        client.say(channel, await changeFont(message, channel));
    } catch (error) {
        console.error(error);
    }
}

/**Data for a twitch channel
 *
 * Settings for channel #daman_gg: {"id":-1,"toggled":{},"esportal":{"name":"test","id":75317132}}
 * data for channel #daman_gg: [{"id":"41837700776","user_id":"62489635","user_login":"daman_gg","user_name":"DaMan_gg","game_id":"32399","game_name":"Counter-Str
 * ike","type":"live","title":"GIBB MED DAGANG | GIVEAWAYS","viewer_count":42,"started_at":"2024-02-06T08:06:39Z","language":"sv","thumbnail_url":"https://static-
 * cdn.jtvnw.net/previews-ttv/live_user_daman_gg-{width}x{height}.jpg","tag_ids":[],"tags":["swe","Svenska","DaddyGamer","everyone","eng","English","counterstrike","esportal"],"is_mature":false}], length: 1
 */

//checks if there is any data to gather, if not, stream is offline and returns false
async function isStreamOnline(channel) {
    const {data: streamData, errorMessage: message} = await request.getData(request.RequestType.StreamStatus, channel);
    if (message) {
        //console.log(`[BotUtils.isStreamOnline], channel: ${channel} - `, `${message}`);
        return false;
    }
    //user_id is the name appearntly for streamstatus, but id for twitchuser data
    if (streamData.data && streamData.data.length > 0) {
        const {user_id: twitchId, login: login} = streamData.data[0];
        await settings.check(twitchId);
    }

    //console.log(`data for channel: ${channel}: ${JSON.stringify(streamData)}, length: ${streamData.length}`);
    return streamData.data && streamData.data.length > 0;
}

function isCreatorChannel(channel) {
    return channel.toLowerCase().replace(/#/g, '') === process.env.CREATOR_CHANNEL;
}

module.exports = {
    isCreatorChannel,
    isStreamOnline,
    sendMessage,
    addChannel,
    isBotModerator,
    showGatherLobby,
    findChangedGames,
    checkMatches
}