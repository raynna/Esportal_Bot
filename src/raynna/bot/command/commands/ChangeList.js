const { addChannel } = require('../../utils/BotUtils');

const {getData, RequestType} = require('../../requests/Request');

class ChangeList {
    constructor() {
        this.moderator = true;
        this.name = 'Changelist';
    }

    async execute(tags, channel, argument, client) {
        try {
            let name = argument ? argument.trim() : "";
            if (!name) {
                return `Please provide a channel, usage; -> !changelist channel`;
            }
            const requestType = RequestType.StreamStatus;
            const { data: twitchData, errorMessage: message } = await getData(requestType, name);
            if (message) {
                if (requestType.errors.notFound) {
                    return requestType.errors.notFound;
                }
                return message;
            }
            //todo check if alrdy added
            await addChannel(client, name);
            return `Add bot to channel: ${channel}, name: ${name}`;
        } catch (error) {
            console.error('Error on TestCommand:', error);
            return 'Nu blev lite fel va? Error: ChangeList.';
        }
    }
}

module.exports = ChangeList;
