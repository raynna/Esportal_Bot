class Stakarn {

    constructor() {
        this.name = 'Stakarn';
        this.emote = true;
        this.triggers = ["rille"];
        this.avoidTag = true;
    }

    async execute(tags, channel, argument, client, isBotModerator) {
        try {
            return "stakarN stakarN stakarN";
        } catch (error) {
            console.log(`An error has occurred while executing command ${this.name}`, error);
        }
    }
}

module.exports = Stakarn ;