const { SECRET_KEY, BRAVE_API_KEY, GOOGLE_API_KEY, RAPID_API_KEY, AMADEUS_API_KEY, AMADEUS_SECRET } = require('../config/env');
const { askOpenAIForIATA } = require("../AI_model/chat_ai");
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
    const destination = typeof item === "string" ? item : item.destination;
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

    return results;
}

const iataCache = new Map();

async function getAirportIATA(city) {
  if (iataCache.has(city) && iataCache.get(city)!="null") {
    return iataCache.get(city);
  }

  const url = `https://aerodatabox.p.rapidapi.com/airports/search/term?q=${encodeURIComponent(city)}&limit=1`;

  const options = {
    headers: {
      'X-RapidAPI-Key': RAPID_API_KEY,
      'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com'
    }
  };

  const response = await axios.get(url, options);
  const items = response.data.items;

  if (items.length > 0) {
    iata = items[0].iata;
  } 
  else {
    iata = await askOpenAIForIATA(city);
  }
  iataCache.set(city, iata);
  return iata;
}


async function processIATA(flights, locations) {
  const result = [];

  const departureCities = flights
    .filter(f => f.departure !== '{location}')
    .map(f => f.departure_eng);

  const destinationCities = flights
    .filter(f => f.destination !== '{location}')
    .map(f => f.destination_eng);
  const locationCities = locations
  ? locations.map(loc => {
      if (typeof loc === 'string') {
        return loc;
      } else {
        return loc.destination_eng;
      }
    })
  : [];
  const uniqueCities = [...new Set([...departureCities, ...destinationCities, ...locationCities])];
  for (const city of uniqueCities) {
    await getAirportIATA(city);
  }
  

  for (const flight of flights) {
    const { departure, departure_eng, destination, destination_eng, departure_date } = flight;

    const isDepartureLocation = departure === '{location}';
    const isDestinationLocation = destination === '{location}';

    if (isDepartureLocation) {
      for (const loc of locations) {
        const depVal = loc.destination_eng;
        const depIata = await getAirportIATA(depVal);
        const destIata = await getAirportIATA(destination_eng);

        result.push({
          departure: loc.destination,
          departure_iata: depIata,
          destination,
          destination_iata: destIata,
          departure_date
        });
      }
    }
    else if (isDestinationLocation) {
      for (const loc of locations) {
        const destVal = loc.destination_eng;
        const depIata = await getAirportIATA(departure_eng);
        const destIata = await getAirportIATA(destVal);

        result.push({
          departure,
          departure_iata: depIata,
          destination: loc.destination,
          destination_iata: destIata,
          departure_date
        });
      }
    } else {
      const depIata = await getAirportIATA(departure_eng);
      const destinationIata = await getAirportIATA(destination_eng);

      result.push({
        departure,
        departure_iata: depIata,
        destination,
        destination_iata: destinationIata,
        departure_date
      });
    }
  }
  return result;
}

const qs = require('qs');
let accessToken = null;
let tokenExpireTime = 0;

async function getAmadeusToken() {
  const now = Date.now();

  if (accessToken && now < tokenExpireTime) {
    return accessToken;
  }

  const tokenRes = await axios.post('https://test.api.amadeus.com/v1/security/oauth2/token',
    qs.stringify({
      grant_type: 'client_credentials',
      client_id: AMADEUS_API_KEY,
      client_secret: AMADEUS_SECRET
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );

  accessToken = tokenRes.data.access_token;
  tokenExpireTime = now + (tokenRes.data.expires_in * 1000);

  return accessToken;
}

async function searchFlights(originIATA, destinationIATA, departureDate) {
  const token = await getAmadeusToken();
  const searchUrl = `https://test.api.amadeus.com/v2/shopping/flight-offers`;

  const response = await axios.get(searchUrl, {
    headers: { Authorization: `Bearer ${token}` },
    params: {
      originLocationCode: originIATA,
      destinationLocationCode: destinationIATA,
      departureDate: departureDate,
      adults: 1,
      currencyCode: 'KRW',
      max: 5
    }
  });

  const offers = response.data.data.map(offer => {
    const itinerary = offer.itineraries[0];
    const segments = itinerary.segments;

    // 전체 segment 경유지 파싱
    const segmentDetails = segments.map(segment => ({
      departureAirport: segment.departure.iataCode,
      departureTime: segment.departure.at,
      arrivalAirport: segment.arrival.iataCode,
      arrivalTime: segment.arrival.at,
      airline: segment.carrierCode,
      flightNumber: segment.number,
      duration: segment.duration
    }));

    return {
      price: offer.price.total,
      currency: offer.price.currency,
      totalDuration: itinerary.duration,
      segments: segmentDetails
    };
  });

  return offers;
}

module.exports = {
    makeRoomId,
    encryptMessage,
    decryptMessage,
    getSearchResult,
    getPlacesByTextSearch,
    collectTourist,
    collectPlaces,
    getAllTransitDirections,
    processIATA,
    searchFlights,
};