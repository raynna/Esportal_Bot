const { getData, RequestType } = require("../../requests/Request");
const Settings = require("../../settings/Settings");
const { checkBannedPlayer, getDefaultWithGameType } = require('../CommandUtils');
const { calculateRank } = require("../../utils/RankUtils");

class TestRank {

    constructor() {
        this.moderator = true;
        this.name = 'TestRank';
        this.settings = new Settings();
    }

    async execute(tags, channel, argument, client, isBotModerator) {
        try {
            // Split the arguments by space
            const args = argument.split(" ");

            // Check if there are enough arguments
            if (args.length < 2) {
                return "!testrank currentElo newElo";
            }

            // Parse Elo values from arguments
            const currentElo = parseInt(args[0]);
            const newElo = parseInt(args[1]);

            // Calculate ranks for current and new Elo values
            const rank = calculateRank(currentElo);
            const newRank = calculateRank(newElo);
            if (rank !== newRank) {
                const rankChangeMessage = newElo > currentElo ? 'ranked up' : 'ranked down';

                return `Raynna ${rankChangeMessage}! ${rank} (${currentElo}) -> ${newRank} (${newElo}).`;
            }
            return "No rank change detected.";
        } catch (error) {
            console.log(`An error has occurred while executing command ${this.name}`, error);
        }
    }
}

module.exports = TestRank;
