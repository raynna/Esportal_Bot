const {getData, RequestType} = require("../../requests/Request");
const Settings = require("../../settings/Settings");
const { checkBannedPlayer, getDefaultWithGameType} = require('../CommandUtils');

const findData = (dataType) => {
    const result = {};

    const searchField = (data, currentPath = []) => {
        for (const key in data) {
            const newPath = currentPath.concat(key);

            if (typeof data[key] === 'object') {
                // If the current property is an object, recursively search within it
                searchField(data[key], newPath);
            } else {
                // Create a unique property name by concatenating the path
                const propertyName = newPath.join('_');
                result[propertyName] = data[key];
            }
        }
    };

    searchField(dataType);

    return result;
};

const searchUserData = (userData, fields) => {
    const result = {};

    const searchField = (data, currentPath = []) => {
        for (const key in data) {
            const newPath = currentPath.concat(key);

            if (typeof data[key] === 'object') {
                // If the current property is an object, recursively search within it
                searchField(data[key], newPath);
            } else if (fields.includes(key)) {
                // If the current property matches one of the specified fields, add it to the result
                result[key] = data[key];
            }
        }
    };

    searchField(userData);

    return result;
};

class TestSearch {

    constructor() {
        this.moderator = true;
        this.name = 'TestSearch';
        this.settings = new Settings();
    }

    async execute(tags, channel, argument, client, isBotModerator) {
        try {
            const { DefaultName: defaultName, GameType: gameType, Message: message} = await getDefaultWithGameType(channel, argument, this.settings);
            if (message) {
                return message;
            }
            const { data: userData, errorMessage: userError } = await getData(RequestType.UserData, defaultName);
            if (userError) {
                return userError;
            }
            const isBanned = await checkBannedPlayer(userData, isBotModerator);
            if (isBanned) {
                return isBanned;
            }
            const search = ['username', 'id', 'game_stats', 'kills', 'deaths'];
            const searchData = searchUserData(userData, search);
            const searchData2 = findData(userData);
            const { game_stats_2_elo,game_stats_2_elotest } = searchData2;
            console.log(JSON.stringify(searchData));
            console.log(`kills: ${searchData.kills}`);
            console.log("SearchData2 " + JSON.stringify(searchData2));
            console.log("cs2 elo: " + game_stats_2_elo + ", invalidData: " + game_stats_2_elotest);
            const { username, id, game_stats } = userData;

            return ``;
        } catch (error) {
            console.log(`An error has occurred while executing command ${this.name}`, error);
        }
    }
}

module.exports = TestSearch;