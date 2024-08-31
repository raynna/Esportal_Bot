class Heaton {

    constructor() {
        this.name = 'Heaton';
        this.emote = true;
        this.avoidTag = true;
    }

    async execute(tags, channel, argument, client, isBotModerator) {
        try {
            return "heatonPOG heatonPOG heatonPOG";
        } catch (error) {
            console.log(`An error has occurred while executing command ${this.name}`, error);
        }
    }
}

module.exports = Heaton ;