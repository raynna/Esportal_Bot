class Dino {

    constructor() {
        this.name = 'Dino';
        this.avoidTag = true;
    }

    async execute(tags, channel, argument, client, isBotModerator) {
        try {
            //await client.say(channel, "DinoDance DinoDance DinoDance");
            return "DinoDance DinoDance DinoDance";
        } catch (error) {
            console.log(`An error has occured while executing command ${this.name}`);
        }
    }
}

module.exports = Dino;