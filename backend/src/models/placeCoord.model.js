const { run, get, all } = require('../config/db');


async function savePlaceToCache(place) {
    await run(`
        INSERT OR REPLACE INTO PlaceCoord 
        (name, lat, lng)
        VALUES (?, ?, ?)
    `, [
        place.name,
        place.geometry.location.lat,
        place.geometry.location.lng
    ]);
}

async function getPlaceFromCache(name) {
    const row = await get(`
        SELECT * FROM PlaceCoord WHERE name = ?
    `, [name]);

    return row;
}


module.exports = {
    savePlaceToCache,
    getPlaceFromCache,
};