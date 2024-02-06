require('dotenv').config();

const tmi = require("tmi.js");

const Commands = require('./command/Commands');
const commands = new Commands();
const Settings = require('./settings/Settings');
const settings = new Settings();

const { updateChannels, connectedChannels } = require('./channels/Channels');
const { sendMessage, addChannel } = require('./utils/BotUtils');

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
            const isModerator = await isModerator(client, channel);
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