class Bengt {

    constructor() {
        this.name = 'Bengt';
        this.emote = true;
        this.triggers = ["bengan", "kloaken"];
        this.avoidTag = true;
    }

    async execute(tags, channel, argument, client, isBotModerator) {
        try {
            return "TwitchConHYPE TwitchConHYPE TwitchConHYPE";
        } catch (error) {
            console.log(`An error has occurred while executing command ${this.name}`, error);
        }
    }
}

module.exports = Bengt ;