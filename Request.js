const axios = require('axios');

async function userData(value, requestType) {
    const requestFunction = async () => {
        const response = await axios.get(`https://api.esportal.com/user_profile/get?username=${encodeURIComponent(name)}&bans=1&current_match=1&team=1`);
        return {data: response.data, errorMessage: null};
    }
    const notFound = `Player ${name} does not exist on Esportal.`;
    return await handleRequest(requestFunction, notFound);
}

const Headers = {
    TWITCH_HEADER: {
        'Client-ID': process.env.TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${process.env.TWITCH_OAUTH_TOKEN}`
    }
}

const RequestType = {
    StreamStatus: {
        name: 'Steam Status Data',
        requiredHeader: Headers.TWITCH_HEADER,
        errors: {
            notFound: 'Twitch channel does not exist'
        },
        link: 'https://api.twitch.tv/helix/streams?user_id={id}',
        values: ['{id}']
    },
    UserData: {
        name: 'User Data',
        requiredHeader: this.ESPORTAL_HEADER.headers,
        errors: {
            notFound: 'This player does not exist on Esportal.',
            webisteDown: 'Esportal seems to be offline for the moment.'
        },
        link: 'https://api.esportal.com/user_profile/get?username={name}&bans=1&current_match=1&team=1',
        values: ['{name}']
    },
    GatherData: {
        name: 'Gather Data',
        errors: {
            notFound: 'This gather does not exist on Esportal'
        },
        link: 'https://api.esportal.com/gather/get?id={gatherId}',
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
    RecentMatchData: {
        name: 'Match Data',
        errors: {
            notFound: 'This gather does not exist on Esportal'
        },
        link: 'https://api.esportal.com/gather/get?id={userId}&page={page}',
        values: ['{userId}', '{page}'],
    }
};

//usage Requests.getData(name, RequestType.UserData);
async function getData(requestType, ...args) {
    let url = requestType.link;
    for (const [index, value] of args.entries()) {
        //console.log(`index: ${index}, arg[${index}]: ${args[index]}, value[${index}]: ${requestType.values[index]}`);
        url = url.replace(requestType.values[index], value);
    }
    const headers = requestType.requiredHeader || {};
    const config = {
        headers: headers
    }
    try {
        return await handleRequest(async () => {
            const response = await axios.get(url, config);
            return {data: response.data, errorMessage: null};
        }, requestType.errors || {});
    } catch (error) {
        return {data: null, errorMessage: error.message};
    }
}

async function handleRequest(requestFunction, additionalParams = {}, maxRetries = 3) {
    const delay = async (ms) => new Promise(resolve => setTimeout(resolve, ms));

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await delay(1000);
            return await requestFunction(additionalParams);
        } catch (error) {
            if (attempt === maxRetries) {
                console.log(`Error status code: ${error.response ? error.response.status : `Unknown`}`);
                //console.error(error);
                if (error.response) {
                    switch (error.response.status) {
                        case 400:
                            if (additionalParams && additionalParams.badRequest) {
                                console.log(additionalParams.badRequest);
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
            await delay(1000);
        }
    }
}

module.exports = {RequestType, getData};