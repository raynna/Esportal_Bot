require('dotenv').config();
axios = require('axios');

const Settings = require('../settings/Settings');
const settings = new Settings();

const {getData, RequestType} = require('../requests/Request');
const request = require('../requests/Request');

const {getFontStyle} = require('./Fonts');
const {getMapName} = require("./MapUtils");

const Logger = require('../log/Logger');
const logger = new Logger();

let maintenance = {player: null, maintenance: false};

async function checkMaintenance(client, connectedChannels) {
    try {
        const {data: maintenanceData, errorMessage: maintenanceError} = await getData(RequestType.Maintenance);
        for (const connected of connectedChannels) {
            if (maintenanceError) {
                continue;
            }
            if (!maintenanceData) {
                if (maintenance[connected]) {
                    maintenance[connected] = false;
                    await sendMessage(client, connected, 'Esportal maintenance is now complete, You should now be able to play again!');
                    continue;
                }
            }
            if (maintenanceData) {
                if (!maintenance[connected]) {
                    maintenance[connected] = true;
                    await sendMessage(client, connected, `Maintenance: ${maintenanceData}`);
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
}

let currentGather = {player: null, gatherId: null};
let firstRun = true;

async function checkGathers(client, connectedChannels) {
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
        const {current_gather_id, username} = userData;
        if (firstRun) {
            currentGather[username] = current_gather_id;
            continue;
        }
        //console.log(`currentMatch: ${current_match.id} for user: ${username}`);
        if (current_gather_id && !currentGather[username]) {
            let result = await showGatherLobby(client, connected, userData, current_gather_id);
            if (result) {
                currentGather[username] = current_gather_id;
                await sendMessage(client, connected, result);
            }
            continue;
        }
        if (!current_gather_id && currentGather[username]) {
            currentGather[username] = null;
            continue;
        }
        currentGather[username] = current_gather_id
        //console.log(`currentMatch[username]: ${JSON.stringify(currentMatch[username])}`);
    }
    firstRun = false;
}


let shownMatchUpdate = {player: null, shown: false};
let currentMatch = {player: null, matchId: null};
let firstMatchCheck = true;

async function checkMatches(client, connectedChannels) {
    try {
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
            //console.log(`currentMatch: ${current_match.id} for user: ${username}`);
            if (firstMatchCheck) {
                currentMatch[username] = current_match.id;
                continue;
            }

            if (current_match && current_match.id !== null) {
                if (!currentMatch[username]) {
                    let result = await showStartedMatch(userData, current_match.id);
                    if (result) {
                        currentMatch[username] = current_match.id;
                        if (result.includes("already started")) {
                            continue;
                        }
                        await sendMessage(client, connected, result);
                    }
                    continue;
                }
                currentMatch[username] = current_match.id;
                let result = await showMatchUpdate(userData, current_match.id);
                if (result) {
                    await sendMessage(client, connected, result);
                    continue;
                }
            }
            if (current_match && current_match.id === null) {
                if (currentMatch[username]) {
                    let result = await showCompletedMatch(userData, currentMatch[username]);
                    if (result) {
                        currentMatch[username] = null;
                        await sendMessage(client, connected, result);
                    }
                    continue;
                }
                currentMatch[username] = current_match.id;
            }
            //console.log(`currentMatch[username]: ${JSON.stringify(currentMatch[username])}`);
        }
        firstMatchCheck = false;
    } catch (error) {
        console.log(error);
    }
}

async function showCompletedMatch(userData, matchId) {
    try {
        const {data: matchData, errorMessage: matchError} = await getData(RequestType.MatchData, matchId);
        if (matchError) {
            console.log(matchError);
            return "";
        }
        const {username} = userData;
        const {team1_score, team2_score, players, map_id} = matchData;
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
        if (team1_score < 13 && team2_score < 13) {
            return `${userData.username}'s match was just cancelled.`;
        }
        return `${userData.username} just ${matchResult} a match: ${mapName} (${displayScore}), Kills: ${kills}, Deaths: ${deaths}, Assists: ${assists}, HS: ${hsratio}%, K/D: ${ratio}, MVP: ${mvp.username}`;
    } catch (error) {
        console.log(error);
    }
}

async function showStartedMatch(userData, matchId) {
    try {
        const {data: matchData, errorMessage: matchError} = await getData(RequestType.MatchData, matchId);
        if (matchError) {
            console.log(matchError);
            return '';
        }
        const {username} = userData;
        const {team1_score, team2_score, team1_avg_elo, team2_avg_elo, players, map_id} = matchData;
        let player = players.find(player => player.username.toLowerCase() === username.toLowerCase());
        const streamersTeam = player ? player.team : 'N/A';
        const displayScore = streamersTeam === 1 ? `${team1_score} : ${team2_score}` : `${team2_score} : ${team1_score}`;
        const mapName = await getMapName(map_id);
        const combinedElo = team1_avg_elo + team2_avg_elo;
        const averageElo = Math.round(combinedElo / 2);
        if (team1_score > 0 || team2_score > 0) {
            return 'already started';
        }
        return `${userData.username} just started a match: ${mapName}, Score: (${displayScore}), Average elo: ${averageElo}`;
    } catch (error) {
        console.log(error);
    }
}

async function showMatchUpdate(userData, matchId) {
    try {
        const {data: matchData, errorMessage: matchError} = await getData(RequestType.MatchData, matchId);
        if (matchError) {
            console.log(matchError);
            return '';
        }
        const {username} = userData;
        const {team1_score, team2_score, players, map_id} = matchData;
        const halfTime = (team1_score + team2_score === 12);
        const overTime = (team1_score === 12 && team2_score === 12);

        if (shownMatchUpdate[userData.username]) {
            if (!overTime && !halfTime) {
                shownMatchUpdate[userData.username] = false;
            }
            return '';
        }
        if ((overTime || halfTime) && !shownMatchUpdate[userData.username]) {
            let player = players.find(player => player.username.toLowerCase() === username.toLowerCase());
            const mvp = players.reduce((prev, current) => (prev.kills > current.kills) ? prev : current);
            const {kills, deaths, assists, headshots} = player;
            const streamersTeam = player ? player.team : 'N/A';
            const won = streamersTeam === 1 ? team1_score > team2_score : team2_score > team1_score;
            const displayScore = streamersTeam === 1 ? `${team1_score} : ${team2_score}` : `${team2_score} : ${team1_score}`;
            const ratio = deaths !== 0 ? (kills / deaths).toFixed(2) : "N/A";
            const hsratio = headshots !== 0 ? Math.floor(headshots / kills * 100).toFixed(0) : "0";
            const mapName = await getMapName(map_id);
            const matchStatus = halfTime ? "reached half time on their" : "is now in a overtime";
            shownMatchUpdate[userData.username] = true;
            return `${userData.username} ${matchStatus} match: ${mapName} (${displayScore}), Kills: ${kills}, Deaths: ${deaths}, Assists: ${assists}, HS: ${hsratio}%, K/D: ${ratio}, current MVP: ${mvp.username}.`;
        }
    } catch (error) {
        console.log(error);
    }
}

function findChangedGames(previous, current) {
    return current.filter((game) => !previous.some((prevGame) => prevGame.id === game.id));
}

async function showGatherLobby(client, channel, userData, gatherId) {
    try {
        const {data: gatherList, errorMessage: errorMessage} = await getData(RequestType.GatherList);
        if (errorMessage) {
            return "";
        }
        const gather = gatherList.find(gather => gather.id === gatherId);
        if (!gather) {
            console.log("error comparing gatherId from List");
            return "";
        }
        const {data: gatherData, errorMessage: gatherError} = await getData(RequestType.GatherData, gatherId);
        if (gatherError) {
            console.log(gatherError);
            return "";
        }
        const {players, creator} = gatherData;
        const {picked_players, map_id} = gather;
        const waiting = players.length - picked_players;
        const mapName = await getMapName(map_id);

        const isModerator = await isBotModerator(client, channel);
        const isCreator = creator.id === userData.id;
        const gatherResult = isCreator ? "started a gather lobby" : `joined ${gather.creator.username}'s gather lobby`;
        if (isModerator) {
            return `${userData.username} ${gatherResult}: https://www.esportal.com/sv/gather/${gatherId} ${mapName}, Waiting: ${waiting}, Picked: ${picked_players}/10`;
        }
        return `${userData.username} ${gatherResult}, ${mapName}, Waiting: ${waiting}, Picked: ${picked_players}/10`;
    } catch (error) {
        console.log(error);
    }
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
    text = text.toString();
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
        if (message) {
            console.log(`[Channel: ${channel}]`, `[Esportal_Bot]`, message);
            client.say(channel, await changeFont(message, channel));
        }
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
    checkMatches,
    checkGathers,
    checkMaintenance
}