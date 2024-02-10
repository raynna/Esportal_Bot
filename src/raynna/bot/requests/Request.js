const axios = require('axios');
const cheerio = require('cheerio');

const { info } = require('../log/Logger');

const Headers = {
    TWITCH_HEADER: {
        'Client-ID': process.env.TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${process.env.TWITCH_OAUTH_TOKEN}`
    }
}

const RequestType = {
    Maintenance: {
        name: 'Maintenance check',
        errors: {
            badRequest: '',
        },
        link: 'https://esportal.com/api/matchmaking/_=0&maintenance_mode_cs2?_=0'
    },
    StreamStatus: {
        name: 'Twitch Status Data',
        requiredHeader: Headers.TWITCH_HEADER,
        errors: {
            notFound: 'Twitch channel does not exist',
            badRequest: 'Twitch channel is offline'
        },
        link: 'https://api.twitch.tv/helix/streams?user_login={channel}',
        values: ['{channel}']
    },
    TwitchUser: {
        name: 'Twitch User',
        requiredHeader: Headers.TWITCH_HEADER,
        errors: {
            notFound: 'Twitch channel does not exist'
        },
        link: 'https://api.twitch.tv/helix/users?login={channel}',
        values: ['{channel}']
    },
    TwitchById: {
        name: 'Twitch User By Id Data',
        requiredHeader: Headers.TWITCH_HEADER,
        errors: {
            notFound: 'Twitch channel does not exist'
        },
        link: 'https://api.twitch.tv/helix/users?id={id}',
        values: ['{id}']
    },
    Leetify: {
        name: 'Leetify',
        errors: {
            notFound: `Player haven't registered their steam on Leetify`
        },
        link: 'https://api.leetify.com/api/profile/{steamId}',
        values: ['{steamId}']
    },
    UserData: {
        name: 'User Data',
        errors: {
            notFound: 'This player does not exist on Esportal.',
            webisteDown: 'Esportal seems to be offline for the moment.'
        },
        link: 'https://api.esportal.com/user_profile/get?_=0&username={name}&bans=1&current_match=1&team=1',
        values: ['{name}']
    },
    GatherData: {
        name: 'Gather Data',
        errors: {
            notFound: 'This gather does not exist on Esportal'
        },
        link: 'https://api.esportal.com/gather/get?_=0&id={gatherId}',
        values: ['{gatherId}'],
    },
    FaceItData: {
        name: 'Faceit Data',
        errors: {
            notFound: 'This player does not exist on Faceit'
        },
        link: 'https://api.faceit.com/users/v1/nicknames/{username}',
        values: ['{username}'],
    },
    FaceitFinder: {
        name: 'Faceit Finder',
        link: 'https://faceitfinder.com/profile/{steamId}',
        values: [`{steamId}`]
    },
    RecentMatchData: {
        name: 'Recent Match Data',
        errors: {
            notFound: 'This gather does not exist on Esportal'
        },
        link: 'https://esportal.com/api/user_profile/get_latest_matches?_=0&id={userId}&page={page}&v=2',
        values: ['{userId}', '{page}']
    },
    RecentMatches: {
        name: 'Recent Matches',
        errors: {
            notFound: 'This gather does not exist on Esportal'
        },
        link: 'https://esportal.com/api/user_profile/get_latest_matches?_=0&id={userId}&page=1&v=2',
        values: ['{userId}']
    },
    MatchData: {
        name: 'Match Data',
        errors: {
            notFound: 'This match does not exist on Esportal'
        },
        link: 'https://esportal.com/api/match/get?_=0&id={matchId}',
        values: ['{matchId}']
    },
    MapData: {
        name: 'Map Data',
        link: 'https://esportal.com/api/maps?_=0'
    },
    GatherList: {
        name: 'Gather List',
        link: 'https://esportal.com/api/gather/list?_=0&region_id=0&subregion_id=0',
    }
};

/**
 * Usage examples:
 * [Request.getData(RequestType.UserData, name);]
 * [Request.getData(RequestType.RecentMatchData, userId, page);]
 * @param requestType
 * @param args
 * @returns {Promise<{data: null, errorMessage}|{data: null, errorMessage: (string|*)}|*|{data: null, errorMessage: string}>}
 */

let REQUEST_COUNTER = {};
let PREVIOUS_REQUEST_COUNTER = {};

function addRequests(requestType) {
    const name = requestType.name; // Assuming the type property holds the identifier for the request type
    if (!REQUEST_COUNTER[name]) {
        REQUEST_COUNTER[name] = 1;
    } else {
        REQUEST_COUNTER[name]++;
    }
}

function showRequests() {
    const result = Object.keys(REQUEST_COUNTER).map(name => {
        const count = REQUEST_COUNTER[name];
        const previousCount = PREVIOUS_REQUEST_COUNTER[name] || 0;
        const change = count - previousCount;

        return `${name}: ${count}${change !== 0 ? `(${change > 0 ? `+${change}` : change})` : ''}`;
    }).join(', ');
    PREVIOUS_REQUEST_COUNTER = { ...REQUEST_COUNTER };
    info("TOTAL REQUESTS", result);
}

function extractFaceitFinder(html) {
    const $ = cheerio.load(html);
    return $('.account-faceit-title-username').text();
}


async function getData(requestType, ...args) {
    let url = requestType.link;
    if (url.includes('_=0')) {
        const currentDate = Date.now(); // Get current date in 'YYYY-MM-DD' format
        url.replace('_=0', currentDate);
    }
    for (const [index, value] of args.entries()) {
        url = url.replace(requestType.values[index], typeof value === 'string' ? value : value);
    }
    const headers = requestType.requiredHeader || {};
    const config = {
        headers: headers,
    };
    try {
        addRequests(requestType);
        return await handleRequest(async () => {
            const response = await axios.get(url, config);
            if (requestType === RequestType.FaceitFinder) {
                console.log(`requestType: ${requestType.name}`);
                console.log(`faceitFinder url: ${url}`);
                const faceit = extractFaceitFinder(response.data);
                if (!faceit) {
                    return { data: null, errorMessage: `This player haven't played any CS2 on Faceit.`};
                }
                return { data: faceit, errorMessage: null };
            }
            return {data: response.data, errorMessage: null};
        }, requestType.errors || {});
    } catch (error) {
        return {data: null, errorMessage: error.message};
    }
}

/**
 * #handleRequest
 *
 * @param requestFunction
 * @param additionalParams
 * @param maxRetries
 *
 * @returns {Promise<{data: null, errorMessage: (string|*)}|{data: null, errorMessage: (string|*)}|*|{data: null, errorMessage: string}>}
 */
async function handleRequest(requestFunction, additionalParams = {}, maxRetries = 5) {
    const delay = async (ms) => new Promise(resolve => setTimeout(resolve, ms));

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            //await delay(1000 * attempt);
            return await requestFunction(additionalParams);
        } catch (error) {
            if (error.response && error.response.status === 429) {
                const retryAfter = error.response.headers['x-rate-limit-duration'] || 2;
                console.log("error status: 429, waiting: " + retryAfter * 1000);
                await delay(retryAfter * 1000);
            } else if (error.code === 'ECONNABORTED') {
                return {data: null, errorMessage: `Request Timeout: ${error.message}`};
            } /*else {
                await delay(2 ** attempt * 1000);
            }*/
            if (attempt === maxRetries) {
                if (error.response) {
                    switch (error.response.status) {
                        case 400:
                            if (additionalParams && additionalParams.badRequest) {
                                //console.log(additionalParams.badRequest);
                                return {data: null, errorMessage: additionalParams.badRequest};
                            }
                            return {data: null, errorMessage: `Bad request: ${error.response.status}`};
                        case 401:
                            return {data: null, errorMessage: `Unauthorized: ${error.response.status}`};
                        case 403:
                            return {data: null, errorMessage: `Forbidden: ${error.response.status}`};
                        case 404:
                            if (additionalParams && additionalParams.notFound) {
                                console.log(additionalParams.notFound);
                                return {data: null, errorMessage: additionalParams.notFound};
                            }
                            return {data: null, errorMessage: `Not found: ${error.response.status}`};
                        case 408:
                            return {data: null, errorMessage: `Request Timeout: ${error.response.status}`};
                        case 429:
                            return {
                                data: null,
                                errorMessage: `Requested information to frequently, try again later.`
                            };
                        case 500:
                            return {data: null, errorMessage: `Internal Server Error: ${error.response.status}`};
                        case 502:
                            return {data: null, errorMessage: `Bad Gateway: ${error.response.status}`};
                        case 503:
                            return {data: null, errorMessage: `Service Unavailable: ${error.response.status}`};
                        case 504:
                            return {data: null, errorMessage: `Gateway Timeout: ${error.response.status}`};
                        case 522:
                            if (additionalParams && additionalParams.webisteDown) {
                                console.log(additionalParams.webisteDown);
                                return {data: null, errorMessage: additionalParams.webisteDown};
                            }
                            return {
                                data: null,
                                errorMessage: `Esportal website seems to be offline at the moment.`
                            };
                        default:
                            return {
                                data: null,
                                errorMessage: `Unhandled error: ${error.response.status} - ${error.response.statusText}`
                            };
                    }
                }
                return {data: null, errorMessage: `Unknown error, contact ${process.env.CREATOR_CHANNEL}`};
            }
        }
    }
}

module.exports = {RequestType, getData, showRequests};