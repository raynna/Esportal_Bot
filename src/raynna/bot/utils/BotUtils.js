require('dotenv').config();
axios = require('axios');

const Settings = require('../settings/Settings');
const settings = new Settings();

const {getData, RequestType} = require('../requests/Request');
const request = require('../requests/Request');

const {getFontStyle} = require('./Fonts');
const {getMapName} = require("./MapUtils");
const {calculateRank} = require('./RankUtils');
const {info} = require('../log/Logger');

let maintenance = {player: null, maintenance: false};
let previousGathers = null;


async function checkMaintenance(client, connectedChannels) {
    try {
        const {data: maintenanceData, errorMessage: maintenanceError} = await getData(RequestType.Maintenance);
        if (maintenanceError) {
            return;
        }
        for (const connected of connectedChannels) {
            if (!await isBotModerator(client, connected)) {
                continue;
            }
            if (!maintenanceData) {
                if (maintenance[connected]) {
                    maintenance[connected] = false;
                    await sendMessage(client, connected, 'Esportals maintenance is now complete, You should now be able to play again!');
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

async function checkMatches(client, connectedChannels, changedMatches) {
    settings.savedSettings = await settings.loadSettings();
    let streamers = [];
    for (const match of changedMatches) {
        await info(`MATCH_CHANGE`, `${match.name}, Active: ${match.active}, Completed: ${match.completed}, Canceled: ${match.canceled}`);
        for (const playerId of match.players) {
            const entry = Object.values(settings.savedSettings).find(entry => entry && entry.esportal && entry.esportal.id === playerId);
            if (entry) {
                const isConnected = Object.values(connectedChannels).find(channel => entry && entry.twitch && entry.twitch.channel === channel)
                if (isConnected) {
                    streamers.push(entry);
                }
            }
        }
    }
    if (streamers.length > 0) {
        for (const entries of streamers) {
            const channel = entries.twitch.channel;
            const userId = entries.esportal.id;

            const gather = Object.values(changedMatches).find(entry => entry.players.includes(userId));
            if (!gather) {
                console.log(`${channel} : couldn't find gather for player`);
                continue;
            }
            const isModerator = await isBotModerator(client, channel);
            if (!isModerator) {
                continue;
            }
            const matchId = gather.match_id;
            const {data: match, errorMessage: matchError} = await getData(RequestType.MatchData, matchId);
            if (matchError) {
                console.log(`${gather.name} : ${matchError}`);
                continue;
            }
            const username = entries.esportal.name;
            const {team1_score, team2_score, players, map_id, team1_avg_elo, team2_avg_elo} = match;
            let streamer = players.find(player => player.username.toLowerCase() === username.toLowerCase());
            const mvp = players.reduce((prev, current) => (prev.kills > current.kills) ? prev : current);
            const {kills, deaths, assists, headshots} = streamer;
            const streamersTeam = streamer ? streamer.team : 'N/A';
            const won = streamersTeam === 1 ? team1_score > team2_score : team2_score > team1_score;
            const averageElo = streamersTeam === 1 ? `${team1_avg_elo}-${team2_avg_elo}` : `${team2_avg_elo}-${team1_avg_elo}`;
            const displayScore = streamersTeam === 1 ? `${team1_score} : ${team2_score}` : `${team2_score} : ${team1_score}`;
            const matchResult = won ? "WON" : "LOST";
            const ratio = deaths !== 0 ? (kills / deaths).toFixed(2) : "N/A";
            const hsRatio = headshots !== 0 ? Math.floor(headshots / kills * 100).toFixed(0) : "0";
            const mapName = await getMapName(map_id);

            const {completed, canceled} = gather;
            let result = `${username} started a match: ${mapName}, Avg ratings: ${averageElo}`;
            if (completed) {
                result = `${username} just ${matchResult} a match: ${mapName} (${displayScore}), Kills: ${kills}, Deaths: ${deaths}, Assists: ${assists}, HS: ${hsRatio}%, K/D: ${ratio}, MVP: ${mvp.username}`;
            } else if (canceled) {
                result = `${username}'s ${mapName} match was canceled.`;
            }
            await sendMessage(client, channel, result);
            const {elo, elo_change} = streamer;
            const rank = calculateRank(elo);
            const newElo = elo + elo_change;
            const newRank = calculateRank(newElo);

            if (rank !== newRank) {
                const rankChangeMessage = elo_change > 0 ? 'ranked up' : 'ranked down';
                const rankChangeResult = `${username} ${rankChangeMessage}! ${rank} (${elo}) -> ${newRank} (${newElo}). @${channel.slice(1)}`;
                await sendMessage(client, channel, rankChangeResult);
            }

        }
    }
}

async function checkGatherList(client, connectedChannels) {
    try {
        settings.savedSettings = await settings.loadSettings();
        const {data: list, errorMessage: listError} = await getData(RequestType.GatherList);
        if (listError) {
            return;
        }
        let streamers = [];
        if (previousGathers) {
            await info(`TOTAL PREVIOUS GATHERLIST`, "Total amount of gathers: " + previousGathers.length);
            await info(`TOTAL GATHERLIST`, "Total amount of gathers: " + list.length);
            const changedMatches = await findChangedMatch(previousGathers, list);
            if (changedMatches.length > 0) {
                await info(`TOTAL CHANGED MATCHES`, `Total amount of changed matches: ${changedMatches.length}`)
                await checkMatches(client, connectedChannels, changedMatches);
            }
            const changedList = await findChangedList(previousGathers, list);
            if (changedList.length > 0) {
                const result = Object.keys(changedList).map(index => {
                    const name = changedList[index].name;
                    const players = changedList[index].players.length;
                    return `${name} (${players})`;
                }).join(', ');
                //info("GATHERLIST CHANGE", `${changedList.length} changed gathers: ${result}`)

                for (const gather of changedList) {
                    const {players, active} = gather;
                    if (active) {
                        continue;
                    }
                    for (const playerId of players) {
                        const entry = Object.values(settings.savedSettings).find(entry => entry && entry.esportal && entry.esportal.id === playerId);
                        if (entry) {
                            const previousGather = previousGathers.find(prevGather => prevGather.id === gather.id);
                            if (previousGather) {
                                const {players} = previousGather;
                                const findSamePlayer = Object.values(players).find(player => player === playerId);
                                if (findSamePlayer) {
                                    continue;
                                }
                            }
                            const isConnected = Object.values(connectedChannels).find(channel => entry && entry.twitch && entry.twitch.channel === channel)
                            if (isConnected) {
                                streamers.push(entry);
                            }
                        }
                    }
                }
            }
            if (streamers.length > 0) {
                for (const entries of streamers) {
                    const channel = entries.twitch.channel;
                    const userId = entries.esportal.id;

                    const gather = Object.values(list).find(entry => entry.players.includes(userId));
                    if (!gather) {
                        continue;
                    }
                    const isModerator = await isBotModerator(client, channel);
                    if (!isModerator) {
                        continue;
                    }
                    const username = entries.esportal.name;
                    const {id, name, creator, players, picked_players, map_id} = gather;
                    const mapName = await getMapName(map_id);
                    const waiting = players.length - picked_players;
                    const isCreator = creator.id === userId;
                    let result;
                    const gatherResult = isCreator ? "started a gather lobby" : `joined ${creator.username}'s gather lobby`;
                    if (isModerator) {
                        result = `${username} ${gatherResult}: https://www.esportal.com/sv/gather/${id} ${mapName}, Waiting: ${waiting}, Picked: ${picked_players}/10`;
                    } else {
                        result = `${username} ${gatherResult}: ${name}, ${mapName}, Waiting: ${waiting}, Picked: ${picked_players}/10`
                    }
                    await sendMessage(client, channel, result);

                }
            }
        }
        previousGathers = list;
    } catch (error) {
        console.log(error);
    }
}

async function findChangedList(previous, current) {
    try {
        const changedId = current.filter((list) => !previous.some((previousList) => previousList.id === list.id));
        const changedPlayers = current.filter((list) => !previous.some((previousList) => arraysEqual(previousList.players, list.players)));
        return [...new Set(changedId.concat(changedPlayers))];
    } catch (error) {
        console.log(error);
    }
}

async function findChangedMatch(previous, current) {
    try {
        return current.filter((currentMatch) => {
            const previousMatch = previous.find((prevMatch) => prevMatch.id === currentMatch.id);

            // Check if the previous match exists and has a different 'active' status
            return previousMatch && previousMatch.active !== currentMatch.active;
        });
    } catch (error) {
        console.log(error);
    }
}

function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false;
    }
    return true;
}

/*async function checkGatherList(client, connectedChannels) {
    try {
        settings.savedSettings = await settings.loadSettings();
        const {data: list, errorMessage: listError} = await getData(RequestType.GatherList);
        if (listError) {
            return;
        }
        let streamers = [];
        if (previousGathers) {
            const newActiveMatches = list.filter(match => match.active);
            const uniqueNewActiveMatches = getUniqueMatches(newActiveMatches, activeMatches);
            if (uniqueNewActiveMatches.length) {
                await info(`UNIQUE ACTIVE MATCH`, `Added unique match to activeMatches.`);
                activeMatches = activeMatches.concat(uniqueNewActiveMatches);
            }
            const changedList = await findChangedList(previousGathers, list);
            if (changedList.length > 0) {
                const result = Object.keys(changedList).map(index => {
                    const name = changedList[index].name;
                    const players = changedList[index].players.length;
                    return `${name} (${players})`;
                }).join(', ');
                //info("GATHERLIST CHANGE", `${changedList.length} changed gathers: ${result}`)

                for (const gather of changedList) {
                    const {players, active} = gather;
                    if (active) {
                        continue;
                    }
                    for (const playerId of players) {
                        const entry = Object.values(settings.savedSettings).find(entry => entry && entry.esportal && entry.esportal.id === playerId);
                        if (entry) {
                            const previousGather = previousGathers.find(prevGather => prevGather.id === gather.id);
                            if (previousGather) {
                                const {players} = previousGather;
                                const findSamePlayer = Object.values(players).find(player => player === playerId);
                                if (findSamePlayer) {
                                    continue;
                                }
                            }
                            const isConnected = Object.values(connectedChannels).find(channel => entry && entry.twitch && entry.twitch.channel === channel)
                            if (isConnected) {
                                streamers.push(entry);
                            }
                        }
                    }
                }
            }
            if (streamers.length > 0) {
                for (const entries of streamers) {
                    const channel = entries.twitch.channel;
                    const userId = entries.esportal.id;

                    const gather = Object.values(list).find(entry => entry.players.includes(userId));
                    if (!gather) {
                        continue;
                    }
                    const username = entries.esportal.name;
                    const {id, name, creator, players, picked_players, map_id} = gather;
                    const mapName = await getMapName(map_id);
                    const waiting = players.length - picked_players;
                    const isModerator = await isBotModerator(client, channel);
                    const isCreator = creator.id === userId;
                    let result;
                    const gatherResult = isCreator ? "started a gather lobby" : `joined ${creator.username}'s gather lobby`;
                    if (isModerator) {
                        result = `${username} ${gatherResult}: https://www.esportal.com/sv/gather/${id} ${mapName}, Waiting: ${waiting}, Picked: ${picked_players}/10`;
                    } else {
                        result = `${username} ${gatherResult}: ${name}, ${mapName}, Waiting: ${waiting}, Picked: ${picked_players}/10`
                    }
                    await sendMessage(client, channel, result);

                }
            }
        }
        previousGathers = list;
    } catch (error) {
        console.log(error);
    }
}*/

async function addChannel(channel) {
    try {
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
    } catch (error) {
        console.log(error);
    }
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
    try {
        text = text.toString();
        const styleMap = await getFontStyle(channel, settings);
        let isLink = false;
        let isTag = false;
        let isEmote = false;
        let emotes = ["DinoDance", "Kappa"];
        return text.split('').map((char, index) => {
            if (text.length - 1 === index && (char === ' ' || char === '\n')) {
                return '';
            } else if ((char === ' ' || char === '\t' || char === '\n') && (isLink || isTag)) {
                isLink = false;
                isTag = false;
                isEmote = false;
            } else if (text.substring(index).startsWith('https://') && !isLink) {
                isLink = true;
            } else if (emotes.some(emote => text.substring(index).startsWith(emote))) {
                isEmote = true;
            } else if (char === '@' && !isLink) {
                isTag = true;
            }
            return (isLink || isTag || isEmote) ? char : (styleMap[char] || char);
        }).join('');
    } catch (error) {
        console.log(error);
    }
}

let lastMessageTime = 0;

async function sendMessage(client, channel, message) {
    try {
        const currentTime = new Date().getTime();
        const timeElapsed = currentTime - lastMessageTime;

        const isMod = await isBotModerator(client, channel);
        const rateLimit = (channel.includes(process.env.CREATOR_CHANNEL) || isMod) ? 100 : 20;

        if (timeElapsed < 30000 / rateLimit) {
            console.log("Bot reached rateLimit");
            return;
        }
        lastMessageTime = currentTime;
        if (message) {
            console.log(`[Channel: ${channel}]`, `[Esportal_Bot]`, message);
            await client.say(channel, await changeFont(message, channel));
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
    try {
        const {
            data: streamData,
            errorMessage: message
        } = await request.getData(request.RequestType.StreamStatus, channel);
        if (message) {
            return false;
        }
        if (streamData.data && streamData.data.length > 0) {
            const {user_id: twitchId} = streamData.data[0];
            await settings.check(twitchId);
        }

        //console.log(`data for channel: ${channel}: ${JSON.stringify(streamData)}, length: ${streamData.length}`);
        return streamData.data && streamData.data.length > 0;
    } catch (error) {
        console.log(error);
    }
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
    checkGatherList,
    checkMaintenance,
    checkMatches
}