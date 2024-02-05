require('dotenv').config();
axios = require('axios');

const request = require('./Request');
const Settings = require('./Settings');
const settings = new Settings();


async function addChannel(client, channel) {
    settings.loadSettings();
    for (const channels of settings.settings) {
        if (channels.twitch.name.includes(channel)) {
            console.log(`Already registered ${channel} on bot.`);
        }
    }
}

async function sendMessage(client, channel, message) {
    try {
        console.log(`bot message: ${message}`);
        client.say(channel, message);
    } catch (error) {
        console.error(error);
    }
}

async function getTwitchId(channel) {
    const { data: streamData, errorMessage: message} = await request.getData(request.RequestType.StreamStatus, channel);
    if (message) {
        if (message.contains('not found')) {
            console.log(`channel not found: ${channel}`);
            //changeList();
            return -1;
        }
        if (message) {
            console.log(`error for channel ${channel}: message`);
            return -1;
        }
    }
    if (streamData.data) {
        console.log(`${channel} userId: ${streamData.data.user_id}`);
        return streamData.data.user_id;
    }
    console.log(`${channel} userId: -1`);
    return -1;
}

async function isStreamOnline(channel) {
    const { data: streamData, errorMessage: message} = await request.getData(request.RequestType.StreamStatus, channel);
    if (message) {
        if (message.contains('not found')) {
            console.log(`channel not found: ${channel}`);
            //changeList();
            return false;
        }
        if (message) {
            console.log(`error for channel ${channel}: message`);
            return false;
        }
    }
    if (streamData.data && streamData.data.length > 0) {
        const twitchId = streamData.data.user_id;
        settings.loadSettings();
        settings.check(twitchId);

    }
    console.log(`data for channel ${channel}: ${JSON.stringify(streamData.data)}, length: ${streamData.data.length}`);
    return streamData.data && streamData.data.length > 0;
}

function isCreatorChannel(channel) {
    return channel.toLowerCase().replace(/#/g, '') === process.env.CREATOR_CHANNEL;
}

module.exports = { isCreatorChannel, isStreamOnline, sendMessage }