require('dotenv').config();
axios = require('axios');

const Settings = require('../Settings');
const settings = new Settings();

const request = require('../requests/Request');

async function addChannel(client, channel) {
    settings.loadSettings();
    const allSettings = Object.keys(settings.settings);
    for (const twitch of allSettings) {
        if (twitch.includes(channel)) {
            console.log(`Already registered channel: ${channel}, id: ${twitch} on bot.`);
            return;
        }
    }
    console.log(`Not registered on on. add: ${channel}`);
}

async function sendMessage(client, channel, message) {
    try {
        console.log(`bot message: ${message}`);
        client.say(channel, message);
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

async function isStreamOnline(channel) {
    const channelWithoutHash = channel.startsWith('#') ? channel.slice(1) : channel;
    const {data: streamData, errorMessage: message} = await request.getData(request.RequestType.StreamStatus, channelWithoutHash);
    if (message) {
        console.log(`[BotUtils.isStreamOnline], channel: ${channel} - `, `${message}`);
        return false;
    }
    if (streamData.data && streamData.data.length > 0) {
        settings.check(channel);
    }
    //console.log(`data for channel ${channel}: ${JSON.stringify(streamData.data)}, length: ${streamData.data.length}`);
    return streamData.data && streamData.data.length > 0;
}

function isCreatorChannel(channel) {
    return channel.toLowerCase().replace(/#/g, '') === process.env.CREATOR_CHANNEL;
}

module.exports = {isCreatorChannel, isStreamOnline, sendMessage, addChannel}