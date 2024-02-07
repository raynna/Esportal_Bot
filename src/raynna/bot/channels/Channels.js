const fs = require('fs');

const Settings = require('../settings/Settings');
const settings = new Settings();

const botUtils = require('../utils/BotUtils');
const {sendMessage, findChangedGames, show, showCompletedMatch} = require('../utils/BotUtils');

const { getData, RequestType } = require('../requests/Request');

let connectedChannels = [];

async function updateChannels(client) {
    try {
        settings.savedSettings = await settings.loadSettings();
        const settingsList = Object.entries(settings.savedSettings);
        const channelsToJoin = new Set();
        const channelsToLeave = new Set();
        let hasChanges = false;

        await Promise.all(connectedChannels.map(async (channel) => {
            try {
                const channelExists = Object.values(settings.savedSettings).some(entry => entry.twitch.channel === channel);

                if (!channelExists) {
                    // If the channel does not exist in savedSettings, remove it
                    channelsToLeave.add(channel);
                    hasChanges = true;
                }
            } catch (error) {
                console.error(`Error checking stream status for ${channel}:`, error);
            }
        }));

        await Promise.all(Object.keys(settings.savedSettings).map(async (twitchId) => {
            const userSettings = settings.savedSettings[twitchId];
            const twitchChannel = userSettings.twitch.channel;

            try {
                const isStreamerOnlineNow = await botUtils.isStreamOnline(twitchChannel);
                if ((botUtils.isCreatorChannel(twitchChannel) || isStreamerOnlineNow) && !connectedChannels.includes(twitchChannel)) {
                    channelsToJoin.add(twitchChannel);
                    hasChanges = true;
                } else if (!isStreamerOnlineNow && !botUtils.isCreatorChannel(twitchChannel) && connectedChannels.includes(twitchChannel)) {
                    channelsToLeave.add(twitchChannel);
                    hasChanges = true;
                }
            } catch (error) {
                console.error(`Error checking stream status for ${twitchChannel}:`, error);
            }
        }));

        if (hasChanges) {
            for (const channel of channelsToJoin) {
                try {
                    await client.join(channel);
                    console.log(`Joined channel: ${channel}`);
                } catch (joinError) {
                    console.error(`Error joining ${channel}:`, joinError);
                }
            }

            for (const channel of channelsToLeave) {
                try {
                    await client.part(channel);
                    console.log(`Left channel: ${channel}`);
                } catch (leaveError) {
                    console.error(`Error leaving ${channel}:`, leaveError);
                }
            }
            connectedChannels = Array.from(new Set([...connectedChannels, ...Array.from(channelsToJoin)]))
                .filter(channel => !channelsToLeave.has(channel));
            if (channelsToJoin.size > 0) {
                console.log('Channels joined:', Array.from(channelsToJoin));
            }

            if (channelsToLeave.size > 0) {
                console.log('Channels left:', channelsToLeave);
            }
        } else {
            const timestamp = new Date().toLocaleString();
            console.log(`Channels list updated at ${timestamp}: ${connectedChannels.length} channels connected - ${connectedChannels.join(', ')}`);
        }

    } catch (error) {
        console.error('An error occurred in updateChannels:', error);
    }
}





async function changeList(client, {
    channel,
    channelToChange,
    tags = null,
    instantUpdate = false,
    remove = false,
    force = false
}) {
    try {
        const currentChannels = getChannelsFromFile(channelsFilePath);
        const normalizedName = channelToChange.trim().toLowerCase().replace(/#/g, '');
        const normalizedChannel = channel.trim().toLowerCase().replace(/#/g, '');
        let response = '';
        let responseToChannel = '';

        if (force) {
            remove = currentChannels.includes(normalizedName);
        }
        if (remove) {
            if (!currentChannels.includes(normalizedName) && normalizedChannel !== normalizedName) {
                await sendMessage(client, channel, `I am not a part of your chat! @${normalizedName}`);
                return;
            }

            const index = currentChannels.findIndex(c => c.toLowerCase() === normalizedName);
            const channelToRemove = [...currentChannels.slice(0, index), ...currentChannels.slice(index + 1)];
            fs.writeFileSync(channelsFilePath, channelToRemove.join('\n'));

            if (client !== null) {
                if (normalizedChannel !== normalizedName) {
                    responseToChannel = `I have now left your channel! @${normalizedName}`;
                }
                const nameToTag = tags != null ? tags.username : normalizedName;
                response = `I am now leaving ${normalizedName} 's chat. @${nameToTag}`;
            }
        } else {
            if (currentChannels.includes(normalizedName)) {
                if (normalizedChannel === normalizedName) {
                    const nameToTag = tags != null ? tags.username : normalizedName;
                    await sendMessage(client, channel, `I am already here! @${nameToTag}`);
                    return;
                }
                await sendMessage(client, channel, `I am already in your chat! @${normalizedName}`);
                return;
            }

            currentChannels.push(normalizedName);
            fs.writeFileSync(channelsFilePath, currentChannels.join('\n'));

            if (client !== null) {
                if (normalizedChannel !== normalizedName) {
                    responseToChannel = `I have now joined your channel! @${normalizedName}`;
                }
                response = `I will now join your chat! @${normalizedName}`;
            }
        }

        if (instantUpdate) {
            const isStreamerOnlineNow = await isStreamerOnline(normalizedName);
            // send current channels message
            await sendMessage(client, channel, response);
            // send remove message before disconnecting.
            if (remove && isStreamerOnlineNow && responseToChannel.trim().length > 0) {
                await sendMessage(client, normalizedName, responseToChannel);
            }
            // send add message after connecting.
            await updateChannels(client);
            if (!remove && isStreamerOnlineNow && responseToChannel.trim().length > 0) {
                await sendMessage(client, normalizedName, responseToChannel);
            }
        }
    } catch (error) {
        console.error('An error occurred in the changeList method:', error);
    }
}

module.exports = {updateChannels, connectedChannels};
