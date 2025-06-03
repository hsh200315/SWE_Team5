const { SECRET_KEY, BRAVE_API_KEY, GOOGLE_API_KEY } = require('../config/env');
const axios = require('axios');
const crypto = require('crypto');
function makeRoomId(roomId) {
    return `room-${roomId}`;
}

// 메시지 암호화
function encryptMessage(plaintext) {
    if(!plaintext || plaintext == '') return '';
    const key = Buffer.from(SECRET_KEY, 'base64');
    const cipher = crypto.createCipheriv('aes-256-ecb', key, null);
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
}
// 메시지 복호화
function decryptMessage(ciphertext) {
    if(!ciphertext || ciphertext == '') return '';
    const key = Buffer.from(SECRET_KEY, 'base64'); 
    const decipher = crypto.createDecipheriv('aes-256-ecb', key, null);
    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

async function getSearchResult(search){
    
    const res = await axios.get('https://api.search.brave.com/res/v1/web/search', {
    headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': BRAVE_API_KEY
    },
    params: { q: search, count: 5 }
    });
    return JSON.stringify(res.data, null, 2);

}

async function getPlacesByTextSearch(query) {
  const url = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
  try {
    const response = await axios.get(url, {
      params: {
        query: query,
        language: 'ko',
        key: GOOGLE_API_KEY
      }
    });

    const places = response.data.results;
    if (!places.length) {
      console.log('📭 검색 결과가 없습니다.');
      return;
    }
    return places;

  } catch (error) {
    console.error('API 호출 실패:', error.message);
  }
}

async function collectTourist(destinations) {
  const allResults = await Promise.all(destinations.map(async (item) => {
    const destination = typeof item === "string" ? item : item.destination;
    const query = `${destination} 관광지`;

    const places = await getPlacesByTextSearch(query);

    const simplifiedPlaces = places.map(place => ({
      name: place.name,
      rating: place.rating,
      address: place.formatted_address,
      url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`
    }));

    return {
      destination: item.destination,
      places: simplifiedPlaces,
    };
  }));

  return allResults;
}

async function collectPlaces(questions, destinations) {
  const allResults = await Promise.all(destinations.map(async (item) => {
    const destination = item.destination;
    const placeResults = await Promise.all(questions.map(async (template) => {
      const query = template.replace("{location}", destination);

      const places = await getPlacesByTextSearch(query);

      const simplifiedPlaces = places.map(place => ({
        name: place.name,
        rating: place.rating,
        address: place.formatted_address,
        url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`
      }));

      return {
        query: query,
        places: simplifiedPlaces
      };
    }));

    return {
      destination: destination,
      places: placeResults
    };
  }));
  return allResults;
}

async function getTransitDirections(origin, destination) {
    const url = 'https://maps.googleapis.com/maps/api/directions/json';

    try {
        const response = await axios.get(url, {
            params: {
                origin: origin,
                destination: destination,
                mode: 'transit',
                language: 'ko',
                key: GOOGLE_API_KEY
            }
        });

        const data = response.data;
        if (data.status !== 'OK') {
            throw new Error(`Google Directions API Error: ${data.status}`);
        }

        const leg = data.routes[0].legs[0];
        const steps = leg.steps.map(step => {
            const basicInfo = {
                mode: step.travel_mode,
                distance: step.distance.text,
                duration: step.duration.text,
                instruction: step.html_instructions
            };

            if (step.travel_mode === 'TRANSIT' && step.transit_details) {
                basicInfo.transit = {
                    vehicle: step.transit_details.line.vehicle.name,
                    lineName: step.transit_details.line.name,
                    shortName: step.transit_details.line.short_name,
                    numStops: step.transit_details.num_stops,
                    departureStop: step.transit_details.departure_stop.name,
                    arrivalStop: step.transit_details.arrival_stop.name
                };
            }

            return basicInfo;
        });
        return {
            origin: origin,
            destination: destination,
            totalDistance: leg.distance.text,
            totalDuration: leg.duration.text,
            steps: steps
        };

    } catch (error) {
        console.error("Axios Error:", error.message);
        return null;
    }
}

async function getAllTransitDirections(transportationList) {
    console.log(transportationList);
    const promises = transportationList.map(item => {
        const origin = item.departure;
        const destination = item.destination;
        return getTransitDirections(origin, destination);
    });

    const results = await Promise.all(promises);

    // null이 포함될 수도 있으므로 필터링 (API 실패 대비)
    return results;
}

module.exports = {
    makeRoomId,
    encryptMessage,
    decryptMessage,
    getSearchResult,
    getPlacesByTextSearch,
    collectTourist,
    collectPlaces,
    getAllTransitDirections
};