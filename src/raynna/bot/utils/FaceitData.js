
const PropertyMap = {
    CSGO_KILLS: 'game_stats_0_kills',
    CS2_KILLS: 'game_stats_2_kills',
    // Add more mappings as needed
};

const autoCompletionObject = (propertyMap) => {
    return Object.fromEntries(Object.keys(propertyMap).map((key) => [key, key]));
};

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

const searchForData = (dataType, fields) => {
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

    searchField(dataType);

    return result;
};

const getObjects = (data) => {
    const result = {};

    // Example: mapping user-friendly property names to the original property names

    // Loop through the property map and create user-friendly objects
    for (const [userFriendlyName, originalName] of Object.entries(PropertyMap)) {
        result[userFriendlyName] = data[originalName];
    }

    return result;
};

module.exports = {getObjects, findData, searchForData, PropertyMap, autoCompletionObject};