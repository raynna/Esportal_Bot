const fs = require('fs');

const botUtils = require('src/raynna/bot/BotUtils');

const channelsFilePath = 'data/channels.txt';
let connectedChannels = [];

function getChannelsFromFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return data.split('\n').map(channel => channel.trim()).filter(channel => channel);
    } catch (error) {
        console.error(`Error getting files from ${filePath}.`);
        return [];
    }
}

async function updateChannels(client) {
    try {
        const channelList = getChannelsFromFile(channelsFilePath);
        const channelsToJoin = new Set();
        const channelsToLeave = new Set();
        let hasChanges = false;

        await Promise.all(connectedChannels.map(async (channel) => {
            try {
                const normalizedChannelWithoutHash = channel.toLowerCase().replace(/#/g, '');
                if (!channelList.map(c => c.toLowerCase()).includes(normalizedChannelWithoutHash) /*&& !isTestChannel(normalizedChannelWithoutHash)*/) {
                    channelsToLeave.add(channel);
                    hasChanges = true;

                }
            } catch (error) {
                console.error(`Error checking stream status for ${channel}:`, error);
            }
        }));

        await Promise.all(channelList.map(async (channel) => {
            const normalizedChannel = `#${channel.toLowerCase().trim()}`;

            try {
                const isStreamerOnlineNow = await botUtils.isStreamOnline(channel);
                if ((botUtils.isCreatorChannel(channel) || isStreamerOnlineNow) && !connectedChannels.includes(normalizedChannel)) {
                    channelsToJoin.add(normalizedChannel);
                    hasChanges = true;
                } else if (!isStreamerOnlineNow && !botUtils.isCreatorChannel(channel) && connectedChannels.includes(normalizedChannel)) {
                    channelsToLeave.add(normalizedChannel);
                    hasChanges = true;
                }
            } catch (error) {
                console.error(`Error checking stream status for ${normalizedChannel}:`, error);
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

module.exports = { updateChannels };
