class Punishd {

    constructor() {
        this.name = 'Punishd';
        this.emote = true;
        this.triggers = ["kim", "punish"];
        this.avoidTag = true;
    }

    async execute(tags, channel, argument, client, isBotModerator) {
        try {
            return "KappaCool KappaCool KappaCool";
        } catch (error) {
            console.log(`An error has occurred while executing command ${this.name}`, error);
        }
    }
}

module.exports = Punishd ;