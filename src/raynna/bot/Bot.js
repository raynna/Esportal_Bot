require('dotenv').config();

const tmi = require("tmi.js");

const Commands = require('./command/Commands');
const commands = new Commands();
const Settings = require('./Settings');
const settings = new Settings();

const { updateChannels, connectedChannels } = require('./channels/Channels');
const { sendMessage } = require('./utils/BotUtils');

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
                //console.log(`Updated channels!`);
            });
        }, 1000);
    } catch (error) {
        console.error('Error on Connected', error);
    }
});

client.on('join', (channel, username, self) => {
    try {
        const normalizedChannel = channel.toLowerCase().trim();

        if (self && !connectedChannels.includes(normalizedChannel)) {
            connectedChannels.push(normalizedChannel);
        }
    } catch (error) {
        console.error('An error occurred in the join event listener:', error);
    }
});

const regexpCommand = new RegExp(/^!([a-zA-Z0-9]+)(?:\s+)?([\s\S]*)?/);

client.on('message', async (channel, tags, message, self) => {
    try {
        const isNotBot = tags && tags.username && tags.username.toLowerCase() !== process.env.TWITCH_BOT_USERNAME;
        if (isNotBot) {
            const match = message.match(regexpCommand);
            if (match) {
                const [, command, argument] = match;
                //const commandInstance = commandManager.commands[command.toLowerCase()];
                const commandTrigger = command.toLowerCase();
                const commandInstance = commands.commands[commandTrigger];
                if (commandInstance && typeof commandInstance.execute === 'function') {
                    try {
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