const axios = require('axios');

// .env.test, .env.development 등 환경별로 로드 가능
require('dotenv').config({ path: '../../.env.test' });

const GOOGLE_API_KEY = process.env.GOOGLE_API;
const BRAVE_API_KEY = process.env.BRAVE_API;


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
  const query = '제주 중문 숙소';
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

//getPlacesByTextSearch();
getSearchResult();
