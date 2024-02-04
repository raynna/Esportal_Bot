require('dotenv').config();

const tmi = require("tmi.js");
const { updateChannels } = require('./Channels');

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
    console.log("Connected!");
}).catch((error) => {
    console.error(error);
});


client.on('connected', (address, port) =>  {
    try {
        setTimeout(() => {
            updateChannels(client).then(r => {
                console.log(`Updated channels!`);
            });
        }, 1000);
    } catch (error) {
        console.error('Error on Connected', error);
    }
});

const readline = require('readline');

process.on('SIGINT', async () => {
    let closingReason = false;
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
        /*for (const channel of connectedChannels) {
            const isModerator = await isBotModerator(client, channel);
            if (isModerator && closingReason.trim() !== '') {
                await leaveMessage(client, channel, closingReason);
            }
        }*/
        await new Promise(resolve => setTimeout(resolve, 2000));
        await client.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('An error occurred during SIGINT handling:', error);
        process.exit();
    }
});