const { addChannel} = require('../../utils/BotUtils');
const { updateChannels } = require('../../channels/Channels');
const {getData, RequestType} = require("../../requests/Request");

class Delay {
    constructor() {
        this.name = 'Delay';
    }

    async execute(tags, channel, argument, client, isBotModerator) {
        return "";
        try {
            const channelWithoutHash = channel.startsWith('#') ? channel.replace('#', '').toLowerCase() : channel.toLowerCase();
            const { data: twitchData, errorMessage: twitchError} = await getData(RequestType.TwitchUser, channelWithoutHash);
            if (twitchError) {
                return twitchError;
            }
            const { id: twitchId } = twitchData.data[0];
            const { data: streamData, errorMessage: errorMessage} = await getData(RequestType.StreamData, twitchId);
            if (errorMessage) {
                return errorMessage;
            }
            console.log(JSON.stringify(streamData));
            const { delay: delay } = streamData.data[0];
            if (delay === 0) {
                return `${channel.slice(1)} doesnt have any delay.`;
            }
            return `${channel.slice(1)} stream delay: ${delay}`;
        } catch (error) {
            console.log(`An error has occurred while executing command ${this.name}`, error);
        }
    }
}

module.exports = Delay;
