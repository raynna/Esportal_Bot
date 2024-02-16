class Guide {

    constructor() {
        this.name = 'Guide';
    }

    async execute(tags, channel, argument, client, isBotModerator) {
        try {
            let response = `You can add this bot to your channel by typing !addme, and !removeme to remove it from your channel. Always make sure to use /mod esportal_bot afterwards to make it work properly.`;
            //await client.say(channel, "DinoDance DinoDance DinoDance");
            if (isBotModerator) {
                response += ` For more information: ${process.env.DISCORD_INVITE_LINK}`
            }
            return response;
        } catch (error) {
            console.log(`An error has occurred while executing command ${this.name}`, error);
        }
    }
}

module.exports = Guide;