class Evarizta {

    constructor() {
        this.name = 'Evarizta';
        this.emote = true;
        this.triggers = ["eva", "rizta"];
        this.avoidTag = true;
    }

    async execute(tags, channel, argument, client, isBotModerator) {
        try {
            return "evarizNYS evarizNYS evarizNYS";
        } catch (error) {
            console.log(`An error has occurred while executing command ${this.name}`, error);
        }
    }
}

module.exports = Evarizta ;