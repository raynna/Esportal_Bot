const { addChannel} = require('../../utils/BotUtils');
const { updateChannels } = require('../../channels/Channels');
const {getData, RequestType} = require("../../requests/Request");
const Settings = require("../../settings/Settings");

class Delay {
    constructor() {
        this.disabled = true;
        this.name = 'Delay';
        this.settings = new Settings();
    }

    async execute(tags, channel, argument, client, isBotModerator) {
        try {
            this.settings.savedSettings = await this.settings.loadSettings();
            const channelWithoutHash = channel.startsWith('#') ? channel.replace('#', '').toLowerCase() : channel.toLowerCase();
            const { data: twitchData, errorMessage: twitchError} = await getData(RequestType.TwitchUser, channelWithoutHash);
            if (twitchError) {
                return twitchError;
            }
            const { id: twitchId } = twitchData.data[0];
            await this.settings.check(twitchId);
            if (this.disabled) {
                this.settings.savedSettings[twitchId].toggled.push(this.name.toLowerCase());
                await this.settings.saveSettings();
                return `This command is currently disabled.`;
            }
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
