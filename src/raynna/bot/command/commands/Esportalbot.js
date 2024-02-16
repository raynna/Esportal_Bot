class Esportalbot {

    constructor() {
        this.name = 'Esportalbot';
        this.triggers = ["esportal_bot"];
    }

    async execute(tags, channel, argument, client, isBotModerator) {
        try {
            let message = `is created by `;
            message += `${process.env.CREATOR_REAL_NAME}`;
            message += `, Esportal: ${process.env.CREATOR_ESPORTAL_NAME}`;
            message += `, Creator Discord: ${process.env.CREATOR_DISCORD}`;
            const isModerator = client.isMod(channel, process.env.TWITCH_BOT_USERNAME);
            if (isModerator) {
                message += `, Bot Discord: ${process.env.DISCORD_INVITE_LINK}`;
            }
            return message;
        } catch (error) {
            console.log(`An error has occurred while executing command ${this.name}`, error);
        }
    }
}

module.exports = Esportalbot;