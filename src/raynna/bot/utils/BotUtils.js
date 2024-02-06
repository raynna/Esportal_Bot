require('dotenv').config();
axios = require('axios');

const Settings = require('../settings/Settings');
const settings = new Settings();

const {getData, RequestType} = require('../requests/Request');
const request = require('../requests/Request');

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

module.exports = {isCreatorChannel, isStreamOnline, sendMessage, addChannel}