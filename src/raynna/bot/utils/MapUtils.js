const { getData, RequestType } = require('../requests/Request');

async function getMapName(mapId) {
    try {
        const mapData = await getData(RequestType.MapData);
        if (mapData) {
            const map = mapData.data.find(m => m.id === mapId);
            return map ? map.name : "Map unknown";
        }
    } catch (error) {
        console.error("Error getting map name", error);
    }
}

module.exports = { getMapName };