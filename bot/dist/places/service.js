"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterPlaces = filterPlaces;
exports.findPlace = findPlace;
exports.renderCard = renderCard;
exports.cardAttachments = cardAttachments;
const data_1 = require("./data");
function haversineKm(aLat, aLon, bLat, bLon) {
    const R = 6371;
    const dLat = ((bLat - aLat) * Math.PI) / 180;
    const dLon = ((bLon - aLon) * Math.PI) / 180;
    const s = Math.sin(dLat / 2) ** 2 +
        Math.cos((aLat * Math.PI) / 180) *
            Math.cos((bLat * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
}
/** Filter places by the GET /api/places query. Throws on unknown station. */
function filterPlaces(query) {
    const wanted = (query.categories ?? '')
        .split(',')
        .map((c) => c.trim().toLowerCase())
        .filter(Boolean);
    let origin;
    if (query.station) {
        const found = data_1.STATIONS[query.station];
        if (!found)
            throw new Error(`unknown station: ${query.station}`);
        origin = found;
    }
    return data_1.PLACES.filter((p) => {
        if (wanted.length > 0 && !p.categories.some((c) => wanted.includes(c)))
            return false;
        if (query.people !== undefined && p.capacity < query.people)
            return false;
        if (query.indoorOnly && !p.indoor)
            return false;
        if (origin && query.radiusKm !== undefined) {
            if (haversineKm(origin.lat, origin.lon, p.lat, p.lon) > query.radiusKm)
                return false;
        }
        return true;
    });
}
function findPlace(placeId) {
    return data_1.PLACES.find((p) => p.id === placeId);
}
/** Human-readable card text the bot sends to the chat on POST /api/suggest. */
function renderCard(place) {
    const lines = [
        `📍 ${place.name}`,
        place.address,
        `Метро: ${place.station} · до ${place.capacity} чел. · ${place.indoor ? 'в помещении' : 'на улице'}`,
    ];
    if (place.openHours)
        lines.push(`Часы: ${place.openHours}`);
    lines.push('', place.description);
    return lines.join('\n');
}
/** Inline keyboard with a map link attached to the suggestion card. */
function cardAttachments(place) {
    return [
        {
            type: 'inline_keyboard',
            payload: {
                buttons: [
                    [
                        {
                            type: 'link',
                            text: 'Открыть на карте',
                            url: `https://yandex.ru/maps/?pt=${place.lon},${place.lat}&z=16&l=map`,
                        },
                    ],
                ],
            },
        },
    ];
}
