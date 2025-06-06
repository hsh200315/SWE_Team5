const axios = require('axios');

// .env.test, .env.development 등 환경별로 로드 가능
require('dotenv').config({ path: '../../.env.test' });

const GOOGLE_API_KEY = process.env.GOOGLE_API;
const BRAVE_API_KEY = process.env.BRAVE_API;
const RAPID_API_KEY = process.env.RAPID_API;
const AMADEUS_API_KEY = process.env.AMADEUS_API;
const AMADEUS_SECRET = process.env.AMADEUS_SECRET;
async function getSearchResult(){
    const axios = require('axios');
    const res = await axios.get('https://api.search.brave.com/res/v1/web/search', {
    headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': BRAVE_API_KEY
    },
    params: { q: "제주 중문 오션뷰 숙소", count: 5 }
    });
    console.log(JSON.stringify(res.data, null, 2));

}

// Text Search API 호출 함수
async function getPlacesByTextSearch() {
  const query = '서울 관광 명소';
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
    console.log(places);
    if (!places.length) {
      console.log('📭 검색 결과가 없습니다.');
      return;
    }

    // 평점 높은 순으로 정렬 (평점 없는 곳은 제외)
    const sorted = places
      .filter(p => p.rating) // 평점 없는 결과 제외
      .sort((a, b) => b.rating - a.rating);

    // 출력
    //console.log(JSON.stringify(sorted, null, 2));
  } catch (error) {
    console.error('API 호출 실패:', error.message);
  }
}



async function getAirportInfo(city) {
  const url = `https://aerodatabox.p.rapidapi.com/airports/search/term?q=${encodeURIComponent(city)}&limit=5`;

  const options = {
    headers: {
      'X-RapidAPI-Key': RAPID_API_KEY,
      'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com'
    }
  };

  try {
    const response = await axios.get(url, options);
    return response.data.items;
  } catch (error) {
    console.error(error);
    return null;
  }
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


(async () => {
  try {
    const results = await searchFlights('ICN', 'NRT', '2025-07-01');
    console.log(JSON.stringify(results, null, 2));
  } catch (err) {
    console.error('Amadeus Error:', err.response?.data || err.message);
  }
})();
//getAirportInfo('Seoul').then(data => console.log(data));
//getPlacesByTextSearch();
//getSearchResult();
