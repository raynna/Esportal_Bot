require('dotenv').config();
axios = require('axios');

const request = require('./Request');


async function sendMessage(client, channel, message) {
    try {
        client.say(channel, changeFont(message, channel));
    } catch (error) {
        console.error(error);
    }
}

async function isStreamOnline(channel) {
    const {data: streamData, errorMessage: message} = await request.checkStreamStatus(channel);
    if (message) {
        if (message.contains('not found')) {
            console.log(`channel not found: ${channel}`);
            //changeList();
            return false;
        }
        if (message) {
            console.log(message);
            return false;
        }
    }
    return streamData.data && streamData.data.length > 0;
}

function isCreatorChannel(channel) {
    return channel.toLowerCase().replace(/#/g, '') === process.env.CREATOR_CHANNEL;
}

module.exports = { isCreatorChannel, isStreamOnline}