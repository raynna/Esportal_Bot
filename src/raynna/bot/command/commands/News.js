const {getData, RequestType} = require("../../requests/Request");

class News {

    constructor() {
        this.name = 'News';
    }

    async execute(tags, channel, argument, client, isBotModerator) {
        try {
            const { data: news, errorMessage: error } = await getData(RequestType.News);
            if (error) {
                return error;
            }
            const latest = news[0];
            const id = latest.id
            const formattedDate = new Date(latest.inserted * 1000).toLocaleDateString();
            let response = `${latest.title} - ${formattedDate}`;
            if (isBotModerator) {
                response += ` https://esportal.com/sv/news/${id}`;
            }
            return response;
        } catch (error) {
            console.log("An error has occured while executing command News");
        }
    }
}

module.exports = News;