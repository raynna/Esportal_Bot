class Rekoj {

    constructor() {
        this.name = 'Rekoj';
        this.emote = true;
        this.avoidTag = true;
    }

    async execute(tags, channel, argument, client, isBotModerator) {
        try {
            return "rekojHAPPY rekojHAPPY rekojHAPPY";
        } catch (error) {
            console.log(`An error has occurred while executing command ${this.name}`, error);
        }
    }
}

module.exports = Rekoj ;