class Daman {

    constructor() {
        this.name = 'Daman';
        this.emote = true;
        this.avoidTag = true;
    }

    async execute(tags, channel, argument, client, isBotModerator) {
        try {
            return "damang4Zoom damang4Zoom damang4Zoom";
        } catch (error) {
            console.log(`An error has occurred while executing command ${this.name}`, error);
        }
    }
}

module.exports = Daman;