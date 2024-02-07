const {getData, RequestType} = require('../requests/Request');


async function getGamesData(userId, duration = "daily") {
    try {
        const allMatches = await getAllMatches(userId, duration);
        const currentDate = new Date();
        const filterFunction =
            duration === "monthly"
                ? match => isMatchPlayedWithinMonth(match.inserted, currentDate)
                : duration === "weekly"
                    ? match => isMatchPlayedWithinLastWeek(match.inserted, currentDate)
                    : match => isMatchPlayedToday(match.inserted, currentDate);


        const filteredMatches = allMatches.filter(filterFunction);
        /*filteredMatches.forEach(match => {
            console.log(`Match played: ${new Date(match.inserted * 1000)}, elo: ${match.elo_change}`);
        });*/

        return filteredMatches.map(match => ({
            elo_change: match.elo_change,
            inserted: match.inserted,
            kills: match.stats.kills,
            deaths: match.stats.deaths
        }));
    } catch (error) {
        console.error(`Error getting games data`, error);
        throw error;
    }
}

async function getAllMatches(userId, duration) {
    let allMatches = [];
    let maxPages = duration === "monthly" ? 80 : duration === "weekly" ? 20 : 5;

    for (let page = 1; page <= maxPages; page++) {
        let recentGames = await getData(RequestType.RecentMatchData, userId, page);
        if (!recentGames.data) {
            if (recentGames.errorMessage) {
                console.log('[GameUtils]', recentGames.errorMessage);
            }
            console.log('[GameUtils]', `UserId: ${userId}, Page: ${page}, RecentGames is null.`);
            break;
        }

        if (page > 1) {
            const lastMatchOfPreviousPage = allMatches[allMatches.length - 1];
            const firstMatchOfCurrentPage = recentGames.data[0];

            if (
                lastMatchOfPreviousPage &&
                firstMatchOfCurrentPage &&
                lastMatchOfPreviousPage.inserted === firstMatchOfCurrentPage.inserted
            ) {
                recentGames.data.shift();
            }
        }
        allMatches.push(...recentGames.data);

        const currentDate = new Date();
        const match = recentGames.data[recentGames.data.length - 1];
        const stopCondition = duration === "monthly" ? !isMatchPlayedWithinMonth(match.inserted, currentDate) :
            duration === "weekly" ? !isMatchPlayedWithinLastWeek(match.inserted, currentDate) :
                !isMatchPlayedToday(match.inserted, currentDate);
        if (stopCondition) {
            break;
        }

    }

    return allMatches;
}


function isMatchPlayedToday(timestamp, currentDate) {
    const matchDate = new Date(timestamp * 1000);
    return (
        matchDate.getUTCDate() === currentDate.getUTCDate() &&
        matchDate.getUTCMonth() === currentDate.getUTCMonth() &&
        matchDate.getUTCFullYear() === currentDate.getUTCFullYear()
    );
}

function isMatchPlayedWithinLastWeek(timestamp, currentDate) {
    const matchDate = new Date(timestamp * 1000);
    const oneWeekAgo = new Date();
    oneWeekAgo.setUTCDate(currentDate.getUTCDate() - 7);
    return matchDate >= oneWeekAgo && matchDate < currentDate;
}

function isMatchPlayedWithinMonth(timestamp, currentDate) {
    const matchDate = new Date(timestamp * 1000);
    const oneMonthAgo = new Date();
    oneMonthAgo.setUTCDate(currentDate.getUTCDate() - 30);
    return matchDate >= oneMonthAgo && matchDate < currentDate;
}

module.exports = {getGamesData};