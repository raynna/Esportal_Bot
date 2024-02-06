require('dotenv').config();

const tmi = require("tmi.js");

const Commands = require('./command/Commands');
const commands = new Commands();
const Settings = require('./settings/Settings');
const settings = new Settings();

const { isBotModerator } = require('./utils/BotUtils');

const { updateChannels, connectedChannels } = require('./channels/Channels');
const { sendMessage, addChannel } = require('./utils/BotUtils');
const { getMapName } = require('./utils/MapUtils');

const client = new tmi.Client({
    connection: {
        reconnect: true,
    },
    identity: {
        username: process.env.TWITCH_BOT_USERNAME,
        password: process.env.TWITCH_OAUTH_TOKEN,
    },
});

client.connect().then(() => {
    console.log(`${process.env.TWITCH_BOT_USERNAME} is now connected!`);
}).catch((error) => {
    console.error(error);
});

const updateInterval = 30 * 1000; // 30 seconds
setInterval(() => {
    updateChannels(client).then(r => {
        //console.log('Updated channels!');
    });
}, updateInterval);

async function showGatherLobby(userData, gatherId, channel, client) {
    const { data: gatherList, errorMessage: errorMessage } = await getData(RequestType.GatherList);
    if (errorMessage) {
        return;
    }
    const gather = gatherList.find(gather => gather.id === gatherId);
    if (!gather) {
        return;
    }
    const { data: gatherData, errorMessage: gatherError } = await getData(RequestType.GatherData, gatherId);
    if (gatherError) {
        return;
    }
    const { players } = gatherData;
    const { picked_players, map_id } = gather;
    const waiting = players.length - picked_players;
    const mapName = await getMapName(map_id);

    const isModerator = await isBotModerator(client, channel);
    if (isModerator) {
        return `${userData.username} started a gather: https://www.esportal.com/sv/gather/${gatherId} ${mapName}, Waiting: ${waiting}, Picked: ${picked_players}/10`;
    }
    return `${userData.username} started a gather lobby, ${mapName}, Waiting: ${waiting}, Picked: ${picked_players}/10`;
}

let previousLobbies = null;

const updateGathers = 3 * 1000;
setInterval(async () => {
    try {
        const esportalResponse = await getData(RequestType.GatherList);
        if (esportalResponse.errorMessage) {
            console.log(esportalResponse.errorMessage);
            return;
        }
        const currentLobbies = esportalResponse.data;
        //console.log("current lobbies: " + currentLobbies.map(changed => `Lobby Name: ${changed.name}, Creator: ${changed.creator.username}`).join(', '));

        if (previousLobbies !== null) {
            const changedLobbies = findChangedLobbies(previousLobbies, currentLobbies);
            //console.log("changed lobbies: " + changedLobbies.map(changed => `Lobby Name: ${changed.name}, Creator: ${changed.creator.username}`).join(', '));

            for (const lobby of changedLobbies) {
                //console.log("changed lobby: " + lobby.name + ", creator: " + lobby.creator.username + "");
                const esportalName = lobby.creator.username;
                settings.savedSettings = await settings.loadSettings();
                const channelEntry  = Object.values(settings.savedSettings).find(entry => entry.esportal.name === esportalName);
                let channel = null;
                if (channelEntry) {
                    channel = channelEntry.twitch.channel;
                }
                if (!channel) {
                    console.log(`New gather created found by ${esportalName}, but they are not registered on the bot.`);
                }
                if (channel) {
                    //console.log("channel: " + channel);
                    let message = ``;
                    //console.log(message);
                    const { data: userData, errorMessage: userError } = await getData(RequestType.UserData, esportalName);
                    if (userError) {
                        return;
                    }
                    const isModerator = await isBotModerator(client, channel);
                    if (!isModerator) {
                        return;
                    }
                    const { current_gather_id } = userData;
                    if (!current_gather_id) {
                        return;
                    }
                    message = await showGatherLobby(userData, current_gather_id, channel, client);
                    console.log(`[Gather created] ${message}`);
                    await sendMessage(client, channel, message);
                }
            }
        }
        previousLobbies = currentLobbies;
        //console.log("set previous lobbies to: " + previousLobbies.map(changed => `Lobby Name: ${changed.name}, Creator: ${changed.creator.username}`).join(', '));
    } catch (error) {
        console.error('Error fetching Esportal data:', error);
    }
}, updateGathers);

function findChangedLobbies(previous, current) {
    return current.filter((lobby) => !previous.some((prevLobby) => prevLobby.id === lobby.id));
}

const request = require('./requests/Request');

client.on('connected', (address, port) =>  {
    try {
        setTimeout(() => {
            updateChannels(client).then(async r => {
                await addChannel("raynnacs");
                /*if (!settings.saveSettings.hasOwnProperty("#raynnacs")) {
                    const requestType = RequestType.TwitchUser;
                    const { data: twitchData, errorMessage: twitchError } = await getData(requestType, "raynnacs");
                    const { id: id, login: channel, display_name: username } = twitchData;
                    settings.save(id, channel, username);
                }*/
                //console.log(`Updated channels!`);
            });
        }, 1000);
    } catch (error) {
        console.error('Error on Connected', error);
    }
});

client.on('join', (channel, username, self) => {
    try {
        const normalizedChannel = channel.startsWith('#') ? channel.replace('#', '').toLowerCase() : channel;

        if (self && !connectedChannels.includes(normalizedChannel)) {
            connectedChannels.push(normalizedChannel);
        }
    } catch (error) {
        console.error('An error occurred in the join event listener:', error);
    }
});

const regexpCommand = new RegExp(/^!([a-zA-Z0-9]+)(?:\s+)?([\s\S]*)?/);
const messageCounts = {};
const messageTimestamps = {};
const cooldowns = {};

client.on('message', async (channel, tags, message, self) => {
    try {
        const isNotBot = tags && tags.username && tags.username.toLowerCase() !== process.env.TWITCH_BOT_USERNAME;
        if (isNotBot) {
            if (!messageCounts[tags.username]) {
                messageCounts[tags.username] = 0;
            }

            if (!messageTimestamps[tags.username]) {
                messageTimestamps[tags.username] = Date.now();
            }

            if (!cooldowns[tags.username]) {
                cooldowns[tags.username] = {};
            }

            if (!cooldowns[tags.username][channel]) {
                cooldowns[tags.username][channel] = 0;
            }

            const currentTime = Date.now();
            const timeDifference = currentTime - messageTimestamps[tags.username];

            if (timeDifference < 30000 && messageCounts[tags.username] >= 20) {
                console.log(`Rate limit exceeded for user ${tags.username}`);
                return;
            }

            if (timeDifference >= 30000) {
                messageTimestamps[tags.username] = currentTime;
                messageCounts[tags.username] = 1;
            } else {
                messageCounts[tags.username]++;
            }
            const match = message.match(regexpCommand);
            if (match) {
                const [, command, argument] = match;
                //const commandInstance = commandManager.commands[command.toLowerCase()];
                const commandTrigger = command.toLowerCase();
                const commandInstance = commands.commands[commandTrigger];
                if (commandInstance && typeof commandInstance.execute === 'function') {
                    try {
                        if (await commands.isBlockedCommand(commandInstance, channel)) {
                            console.log(`Command ${command} is blocked in channel ${channel}`);
                            return;
                        }
                        const commandCooldown = cooldowns[tags.username][channel];
                        if (commandCooldown && currentTime - commandCooldown < 5000) {
                            console.log(`Command cooldown active for user ${tags.username}`);
                            return;
                        }
                        cooldowns[tags.username][channel] = currentTime;
                        const playerIsMod = tags.mod
                        const isModerator = await client.isMod(channel, process.env.TWITCH_BOT_USERNAME);
                        const isStreamer = channel.slice(1).toLowerCase() === tags.username.toLowerCase();
                        if (commands.isModeratorCommand(commandInstance)) {
                            const playerIsMod = tags.mod;
                            const isStreamer = channel.slice(1).toLowerCase() === tags.username.toLowerCase();
                            const isCreator = tags.username.toLowerCase() === process.env.CREATOR_CHANNEL;
                            if (!(playerIsMod || isStreamer || isCreator)) {
                                await sendMessage(client, channel, 'Only the streamer or a moderator can use this command.');
                                return;
                            }
                        }
                        console.log(`${playerIsMod ? `[Mod]` : isStreamer ? `[Streamer]` : `[Viewer]`} ${tags.username} has used the command: ${message} in channel: ${channel}`);
                        const result = await commandInstance.execute(tags, channel, argument, client);
                        await sendMessage(client, channel, result);
                        console.log(`[Channel: ${channel}] ${isModerator ? `[Mod] ` : ``}Esportal_Bot: ${result}`);
                    } catch (e) {
                        const errorMessage = e.message || 'An error occurred while processing the command.';
                        await sendMessage(client, channel, errorMessage);
                        console.error('An error occurred in the message handler:', e);
                    }
                }
            }
        }
    } catch (error) {
        console.error('An error occurred in the message handler:', error);
    }
});

const readline = require('readline');
const {RequestType, getData} = require("./requests/Request");

process.on('SIGINT', async () => {
    let closingReason = false;
    closingReason = " ";
    try {
        if (!closingReason) {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
            });
            closingReason = await new Promise(resolve => {
                rl.question('Enter reason for closing: ', answer => {
                    rl.close();
                    resolve(answer);
                });
            });
        }

        console.log(`Bot going offline, Reason: ${closingReason.trim() !== '' ? closingReason : 'No Reason'}.`);
        for (const channel of connectedChannels) {
            const isModerator = await isBotModerator(client, channel);
            if (isModerator && closingReason.trim() !== '') {
                await sendMessage(client, channel, closingReason);
            }
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
        await client.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('An error occurred during SIGINT handling:', error);
        process.exit();
    }
});