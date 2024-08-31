class Pani {

    constructor() {
        this.name = 'Pani';
        this.emote = true;
        this.avoidTag = true;
    }

    async execute(tags, channel, argument, client, isBotModerator) {
        try {
            return "paniSAIK paniSAIK paniSAIK";
        } catch (error) {
            console.log(`An error has occurred while executing command ${this.name}`, error);
        }
    }
}

module.exports = Pani;