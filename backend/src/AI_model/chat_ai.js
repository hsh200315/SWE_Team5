const { ChatOpenAI } = require("langchain/chat_models/openai");
const { HumanMessage } = require("langchain/schema");
const { OPENAI_API_KEY } = require('../config/env');
const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

async function streamChat({ msg, chatLogs, onToken, onDone }) {
  const model = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0.5,
    streaming: true,
    openAIApiKey: OPENAI_API_KEY,
    callbacks: [
      {
        handleLLMNewToken(token) {
          onToken(token);
        },
        handleLLMEnd() {
          if (onDone) onDone();
        }
      },
    ],
  });
  //console.log(msg);
  //console.log(chatLogs);
  await model.call([new HumanMessage(msg)]);
}

async function travelPlanningPipeline(chat_history, user_question) {
  let recommendedList;
  let tourist;
  let accommodation;
  let restaurant;
  let transportation;
  let flight;

  const parsing_result = await parseUserQuestion(chat_history, user_question);

  if ("travel_destination" in parsing_result) {
    recommendedList = await recommendDestinations(parsing_result.travel_destination);
    console.log("추천된 여행지 목록:", recommendedList);

    if ("tourist_attraction" in parsing_result) {
      const results = await collectTourist(recommendedList);
      tourist = await askTourlist(results, parsing_result.extra);
    }
  } else {
    if ("tourist_attraction" in parsing_result) {
      recommendedList = parsing_result.tourist_attraction;
      const results = await collectTourist(recommendedList);
      recommendedList = await askTourlist(results, parsing_result.extra);
    }
  }

  if ("accommodation" in parsing_result && parsing_result.accommodation != 'x') {
    const results = await collectPlaces(parsing_result.accommodation, recommendedList);
    accommodation = await askAccommodation(results, parsing_result.extra);
  }

  if ("restaurant" in parsing_result && parsing_result.restaurant != 'x') {
    const results = await collectPlaces(parsing_result.restaurant, recommendedList);
    restaurant = await askRestaurant(results, parsing_result.extra);
  }

  if ("transportation" in parsing_result && parsing_result.transportation != 'x') {
    transportation = await getAllTransitDirections(parsing_result.transportation);
  }

  if ("flight" in parsing_result && parsing_result.flight.destination != 'x') {
    function formatDateForSkyscanner(dateStr) {
      return dateStr.replace(/-/g, '');
    }

    const processedFlights = await processIATA(parsing_result.flight, recommendedList);
    const finalFlights = [];

    for (const flightItem of processedFlights) {
      const offers = await searchFlights(
        flightItem.departure_iata,
        flightItem.destination_iata,
        flightItem.departure_date
      );
      const skyscannerUrl = `https://www.skyscanner.co.kr/transport/flights/${flightItem.departure_iata.toLowerCase()}/${flightItem.destination_iata.toLowerCase()}/${formatDateForSkyscanner(flightItem.departure_date)}/`;

      finalFlights.push({
        ...flightItem,
        offers: offers,
        url: skyscannerUrl
      });
    }

    flight = finalFlights;
  }

  return {
    parsing_result,
    recommendedList,
    tourist,
    accommodation,
    restaurant,
    transportation,
    flight
  };
}

async function parseUserQuestion(chat_history, user_question) {
  const moment = require('moment-timezone');
  const koreaNow = moment().tz("Asia/Seoul").format("YYYY-MM-DD HH:mm:ss");
  const systemPrompt = `
    너는 사용자의 여행 관련 질문을 분석해서 아래 6가지 유형으로 분류하는 역할을 한다:
    1. travel_destination
    2. tourist_attraction
    3. transportation
    4. flight
    5. accommodation
    6. restaurant
    7. extra

    사용자의 질문에는 하나 이상의 유형이 포함될 수 있고, 포함되지 않은 항목은 출력에 절대 포함되지 않아야 한다. 질문에 유형이 포함되어 있다면 각 항목은 아래와 같이 응답해야 한다:

    - travel_destination: 국가나 도시에 대한 추천 질문일 때 생성한다. llm에 물어보기 적합하도록, 사용자의 의도를 담은 문장을 생성해 제공한다. 사용자의 질문에 추천 개수 관련 표현(예: 몇 군데, 3곳, 여러 군데, 다수 등)이 포함된 경우 반드시 해당 개수 요청을 travel_destination에 포함하여 문장을 생성한다.
    - tourist_attraction: 특정 도시 내부에서 "관광"할 만한 "장소 추천 요청"일 때만 항목을 생성한다. 특정 도시들에 대한 명시가 있다면 해당 도시들을 추출해서 {"destination": "여행지 이름",
        "destination_eng" : "여행지 영어 이름"} 객체의 배열 형태로 나열한다. 도시에 대한 명시가 되어있지 않다면 tourist_attraction 항목만 생성하고 value는 빈 배열로 둔다. 무조건 배열 형태로 출력한다. 관광지에 대한 장소 추천 요청, 질문이 아닌 경우 이 항목은 출력하지 않는다. 
    - 사용자가 특정 도시 이름을 명시하며 장소 추천을 하는 경우 tourist_attraction으로 우선 분류한다.
    - transportation: departure와 destination을 명시한다. 복수의 이동 경로가 포함되어 있다면 시간 순서를 추측해서 배열로 나열한다. 검색 위치가 명확하지 않은 경우 transportation은 'x'로 표기한다. 항공편을 제외한 교통편을 물어볼 때 생성한다. 'x'로 출력하는 경우를 제외하고 항상 배열 형태이다.
    - flight: departure, destination, departure_eng, destination_eng, departure_date를 명시한다. departure_eng, destination_eng은 departure와 destination 각각을 영어로 변환한 것이다. 왕복과 같은 뉘앙스를 가진 질문이라면 departure와 destination을 뒤집은 경우도 생성한다. 각각이 명시되지 않았다면 departure는 '서울', destination은 'x', departure_date는 현재 날짜로 기록한다. travel_destination 항목이 있으면서 검색 위치가 명확하지 않은 경우에는 '{location}'으로 작성한다. departure_date의 데이터 타입은 date로 하며 여행 기간과 관련있는 내용이 있다면 반영해서 생성한다. 'x'로 출력하는 경우를 제외하고 무조건 배열 형태로 출력한다.
    - accommodation: 사용자의 요청을 기반으로 반드시 **지역명 + 숙소 키워드가 포함된 간결한 검색 문장**의 배열 형태로 작성한다. 예를 들어 ['서울 숙소'], ['제주 중문 호텔'], ['부산 해운대 가족 호텔']처럼 작성한다. travel_destination이나 tourist_attraction 항목이 있으면서 검색 위치가 명확하지 않은 경우에는 '{location} 숙소'처럼 작성한다. 그 외 검색 위치가 명확하지 않은 경우에는 아무것도 출력하지 않고 'x'만 출력한다. 여러 지역에 대한 숙소를 물어본다면 각각을 나눠서 배열로 생성한다. 'x'로 출력하는 경우를 제외하고 무조건 배열 형태로 출력한다.
    - restaurant: 사용자의 요청을 기반으로 반드시 **지역명 + 숙소 키워드가 포함된 간결한 검색 문장**의 배열 형태로 작성한다. 예를 들어 ['서울 음식점'], ['제주 중문 해산물 음식점']처럼 작성한다. travel_destination이나 tourist_attraction 항목이 있으면서 검색 위치가 명확하지 않은 경우에는 '{location} 음식점'처럼 작성한다. 그 외 검색 위치가 명확하지 않은 경우에는 아무것도 출력하지 않고 'x'만 출력한다. 여러 지역에 대한 음식점을 물어본다면 각각을 나눠서 배열로 생성한다. 'x'로 출력하는 경우를 제외하고 무조건 배열 형태로 출력한다.
    - extra: 사용자의 채팅내역과 질문에서 여행 관련 추천 시 필요한 추가 정보를 반드시 추출하여 포함한다.
      - 포함해야 할 정보: 
        - 여행 기간
        - 예산
        - 사용자가 원하는 특징 (예: 자연 경관, 액티비티, 휴양, 역사 유적, 관광지 다양성, 혼잡도 등)
        - 특별한 요청사항 (예: 가족 여행, 커플 여행, 아이 동반 등)
        - 각 항목에 대해 추천받고 싶은 개수 (음식점 : 여러 곳, 관광지 : 1개)
      - 사용자의 질문 안에 이러한 정보가 직접적으로 명시되거나, 숙소·여행지 추천 요청 내 포함된 수식어에서도 파생될 경우 반드시 해당 키워드를 추출하여 extra에 포함한다.
      - 관련 정보가 없을 경우 해당 항목은 포함하지 않는다.

    아래 형식은 예시이며, 출력 형식은 반드시 순수한 JSON 텍스트만 반환해야 하며, 다른 설명, 문장, 코드 블록 표시, 기호 \` 등을 절대 포함하지 않는다.

    {
      "travel_destination": "예시 응답",
      "tourist_attraction": [
        "제주도", "서울", "부산", ...
      ],
      "transportation": [
        {"departure": "남산타워", "destination": "강남역"},
        {"departure": "강남역", "destination": "명동"}
      ],
      "flight": {"departure": "서울", "departure_eng": "Seoul" "destination": "제주도", "destination_eng": "Jeju", "departure_date": "~"},
      "accommodation": ["제주 중문 바다 전망 숙소"],
      "restaurant": ["대전 칼국수 맛집"],
      "extra": "여행 기간 4일, 자연경관"
    }
    `;

  const messages = [
    { role: "system", content: systemPrompt.trim() },
    { role: "user", content: `채팅 내역:\n${chat_history}\n\n현재 질문:\n${user_question} \n\n 현재 시각:${koreaNow}` }
  ];

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
  });

  const parsing_result = JSON.parse(completion.choices[0].message.content.trim());
  return parsing_result;
}


async function recommendDestinations(travelDestinationText) {
  const travel_destination_prompt = `
  너는 사용자의 여행 요청에 따라 여행지를 추천하는 전문가야.
  사용자의 요청을 분석해서 여행지를 추천하되, **"3곳 추천해줘", "여러 군데", "몇 군데"** 등 복수 요청이 없으면 1곳만 추천해. 복수 요청이 있으면 그것에 맞춰서 여러 곳 추천해줘.
  여행지는 나라가 아닌 도시를 추천해야 해
  추천 결과는 항상 다음과 같은 **배열(JSON Array)** 형식으로 출력해야 해:
  [
    {
      "destination": "여행지 이름",
      "destination_eng" : "여행지 공식 영어 이름",
      "explanation": "추천 이유를 한 문장 이상으로 설명"
    },
    ...
  ]
  다른 텍스트, 설명, 마크다운 없이 **순수 JSON 배열만 출력**해야 한다. 다른 설명, 문장, 코드 블록 표시, 기호 \` 등을 절대 포함하지 않는다.
  `;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: travel_destination_prompt },
      { role: "user", content: `user request : ${travelDestinationText}`}
    ]
  });

  const raw = completion.choices[0].message.content.trim();
  return JSON.parse(raw);
}


async function askTourlist(allResults, extraInfo) {
  const systemPrompt = `
    너는 여행 전문가야. 아래 여러 지역의 관광지 후보 리스트를 보고 각 지역마다 사용자의 의도에 맞게 관광지를 추천해줘.
    반드시 다음과 같은 JSON 형태로 출력해:
    [
      {
        "destination": "지역명1",
        "destination_eng": "지역명1의 영문명",
        "places": [
          { "name": "장소명", "reason": "추천 이유", "url": "https://..." },
          ...
        ]
      },
      {
        "destination": "지역명2",
        "destination_eng": "지역명2의 영문명",
        "places": [
          ...
        ]
      }
    ]

    다른 텍스트, 설명, 마크다운 없이 **순수 JSON 배열만 출력**해야 한다.  
    다른 설명, 문장, 코드 블록 표시, 기호 \` 등을 절대 포함하지 않는다.
    `

  let userInput = `다음은 지역별 관광지 후보와 사용자의 요청이다:\n\n`;

  for (const result of allResults) {
    userInput += `지역: ${result.destination}\n`;
    userInput += `후보 리스트: ${JSON.stringify(result.places)}\n\n`;
  }
  userInput += `\n사용자의 요청에 대한 추가 정보 : ${extraInfo}`;
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userInput }
    ],
    temperature: 0.3
  });

  try {
    const raw = completion.choices[0].message.content.trim();
    const result = JSON.parse(raw);
    return result;
  } catch (e) {
    console.error("JSON 파싱 실패:", e);
  }
}

async function askAccommodation(allResults, extraInfo) {
  const systemPrompt = `
    너는 여행 전문가야. 아래 여러 지역의 숙소 후보 리스트를 보고 각 지역마다 사용자의 의도에 맞게 숙소를 추천해줘.
    반드시 다음과 같은 JSON 형태로 출력해:
    {
      "지역명1": [
        {"name": "숙소명", "reason": "추천 이유", "url": "https://..."},
        ...
      ],
      "지역명2": [
        ...
      ]
    }
    다른 텍스트, 설명, 마크다운 없이 **순수 JSON 배열만 출력**해야 한다. 다른 설명, 문장, 코드 블록 표시, 기호 \` 등을 절대 포함하지 않는다.
  `;

  let userInput = `다음은 지역별 숙소 후보와 사용자의 요청이다:\n\n`;

  for (const result of allResults) {
    userInput += `지역: ${result.destination}\n`;
    userInput += `후보 리스트: ${JSON.stringify(result.places)}\n\n`;
  }
  userInput += `\n사용자의 요청에 대한 추가 정보 : ${extraInfo}`;
  console.log(userInput);
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userInput }
    ],
    temperature: 0.3
  });

  try {
    const raw = completion.choices[0].message.content.trim();
    const result = JSON.parse(raw);
    return result;
  } catch (e) {
    console.error("JSON 파싱 실패:", e);
  }
}

async function askRestaurant(allResults, extraInfo) {
  const systemPrompt = `
    너는 여행 전문가야. 아래 여러 지역의 음식점 리스트를 보고 각 지역마다 사용자의 의도에 맞게 음식점을 추천해줘.
    반드시 다음과 같은 JSON 형태로 출력해:
    {
      "지역명1": [
        {"name": "음식점명", "reason": "추천 이유", "url": "https://..."},
        ...
      ],
      "지역명2": [
        ...
      ]
    }
    다른 텍스트, 설명, 마크다운 없이 **순수 JSON 배열만 출력**해야 한다. 다른 설명, 문장, 코드 블록 표시, 기호 \` 등을 절대 포함하지 않는다.
  `;

  let userInput = `다음은 지역별 음식점 후보와 사용자의 요청이다:\n\n`;

  for (const result of allResults) {
    userInput += `지역: ${result.destination}\n`;
    userInput += `후보 리스트: ${JSON.stringify(result.places)}\n\n`;
  }
  userInput += `\n사용자의 요청에 대한 추가 정보 : ${extraInfo}`;
  console.log(userInput);
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userInput }
    ],
    temperature: 0.3
  });

  try {
    const raw = completion.choices[0].message.content.trim();
    const result = JSON.parse(raw);
    return result;
  } catch (e) {
    console.error("JSON 파싱 실패:", e);
  }
}

async function askOpenAIForIATA(city) {
  const systemPrompt = `
  너는 세계의 도시명과 그 도시에 가까우면서 가장 유명한 공항의 IATA 코드를 매핑해주는 시스템이다.
  주어진 도시명을 기반으로 공항의 IATA 코드를 알려줘. 절대 거짓으로 답변하지 마
  답변은 반드시 IATA 코드로 3글자만 출력해야 하고, 추가 설명이나 문장, 기호 등은 절대 포함하지 마.
  `;

  const userPrompt = `도시명: ${city}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]
  });

  const raw = completion.choices[0].message.content.trim();
  console.log(raw);
  return raw;
}

module.exports = { streamChat, askTourlist, askAccommodation, askRestaurant, askOpenAIForIATA, parseUserQuestion, recommendDestinations, travelPlanningPipeline };
