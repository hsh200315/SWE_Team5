const { success, failed } = require('../utils/response');
const OpenAI = require("openai");
const { OPENAI_API_KEY, BRAVE_API_KEY } = require('../config/env');
const { getSearchResult } = require('../utils/utils');
const chatModel = require('../models/chat.model')

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

module.exports = {
  promptGeneration: async (req, res) => {
    try {
      const { chatHistory, msg } = req.body;
      if (!chatHistory || !msg) {
        return failed(res, {
          code: 400,
          message: "chat_history와 msg를 모두 포함해야 합니다.",
          error: 'Bad Request'
        });
      }

      let chatLogs = '';
      for (const chatId of chatHistory) {
          const result = await chatModel.findById({ chatId });
          if (result instanceof Error) {
              socket.emit("AI-chat-error", {message: "msg is not sent because of AI chat error."});
              continue;
          }
          chatLogs += `${result.sender_id}: ${result.message}\n`;
      }

      const systemPrompt = `
        너는 여행 일정 및 계획에 관한 질문을 다루는 전문가야.

        사용자가 보낸 질문은 종종 맥락이 부족하거나 모호할 수 있어.
        네 임무는 대화 내역과 현재 질문을 기반으로, AI가 이해하기 쉬운 구체적이고 명확한 여행 관련 질문으로 재작성하는 것이다.

        - 질문의 목적(예: 장소 추천, 예산 계획, 일정 조정 등)을 파악해 명확히 표현해야 해.
        - 생략된 지명, 일정, 동행 여부, 관심사 등이 대화에 있다면 반드시 반영해.
        - 여행 관련 정보 종류는 크게 여행지, 숙소, 음식점, 항공편, 교통편이야 만약 질문에 여러 종류의 질문이 포함되어있다면 하나씩 질문해달라고 답변해야 해.
        - 여행과 무관한 정보는 포함하지 마.
        - 결과는 개선된 질문만 출력하고, 그 외 설명이나 서술은 하지 마.
        - 출력은 존댓말이 아닌 자연스럽고 부드러운 반말체로 작성해.
        `;

      const messages = [
        { role: "system", content: systemPrompt.trim() },
        { role: "user", content: `채팅 내역:\n${chatLogs}\n\n현재 질문:\n${msg}` }
      ];

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
      });

      const result = completion.choices[0].message.content;

      return success(res, {
        code: 200,
        message: "Successfully generate prompt.",
        data: result
      });

    } catch (err) {
      console.error(err);
      return failed(res, {
        code: 500,
        message: err.message,
        error: 'Internal Server Error'
      });
    }
  },

  questionParsing: async(req, res) => {
    const { chat_history, user_question } = req.body;

    // chat_history를 문자열로 변환
    const formattedHistory = chat_history.map(msg => `${msg.username}: ${msg.message}`).join('\n');
    const systemPrompt = `
      너는 사용자의 여행 관련 질문을 아래 6가지 유형으로 분류하는 역할을 한다:
      1. travel_destination
      2. tourist_attraction
      3. transportation
      4. flight
      5. accommodation
      6. restaurant
      7. 그 외 (extra)

      사용자의 질문에는 하나 이상의 유형이 포함될 수 있고, 포함되지 않은 항목은 출력에 포함되지 않아야 한다. 질문에 유형이 포함되어 있다면 각 항목은 아래와 같이 응답해야 한다:

      - travel_destination: 특정 도시나 나라와 같은 여행지를 추천해달라는 질문에 해당한다. llm에 물어보기 적합하도록, 사용자의 의도를 담은 문장을 생성해 제공한다. 사용자의 질문에 개수 관련 요청이 있다면 문장 생성 시 반영한다.
      - tourist_attraction: 관광 명소를 추천해달라는 질문에 해당한다. llm에 물어보기 적합하도록, 사용자의 의도를 담은 문장을 생성해 제공한다. 사용자의 질문에 개수 관련 요청이 있다면 문장 생성 시 반영한다.
      - 특히, 여행지나 관광 명소에 대한 질문이 없으면서 검색 위치도 명확하지 않은 경우 교통편, 항공편, 숙소, 음식점은 x로 표기한다.
      - transportation: 출발지와 도착지를 명시한다. 복수의 이동 경로가 포함되어 있다면 시간 순서대로 배열한다.
      - flight: 출발지와 도착지를 명시한다. 명시되지 않으면 출발지는 '서울', 도착지는 'x'으로 기록한다.
      - accommodation: 구체적인 검색 위치가 있다면 사용자의 의도에 맞게 검색할 수 있는 짧은 문장을 생성한다. 만약 구체적인 검색 위치(지역명)가 명확하지 않지만 여행지나 관광 명소에 대한 질문이 포함되어 있는 경우 "{location}"으로 표시하고, 사용자의 의도를 포함하는 간단한 설명을 포함한다.
      - restaurant: 구체적인 검색 위치가 있다면 사용자의 의도에 맞게 검색할 수 있는 짧은 문장을 생성한다. 만약 구체적인 검색 위치(지역명)가 명확하지 않지만 여행지나 관광 명소에 대한 질문이 포함되어 있는 경우 "{location}"으로 표시하고, 관련 설명을 포함한다.
      - extra: 위 항목에 포함되지 않는 기타 여행 관련 요청이나 질문을 요약하여 제공한다.

      아래 형식은 예시이며, 출력 형식은 반드시 순수한 JSON 텍스트만 반환해야 하며, 다른 설명, 문장, 코드 블록 표시, 기호 \` 등을 절대 포함하지 않는다.

      {
        "travel_destination": "예시 응답",
        "tourist_attraction": "예시 응답",
        "transportation": [
          {"출발지": "남산타워", "도착지": "강남역"},
          {"출발지": "강남역", "도착지": "명동"}
        ],
        "flight": {"출발지": "서울", "도착지": "오키나와"},
        "accommodation": "제주 중문 바다 전망 숙소",
        "restaurant": "대전 칼국수 맛집",
        "extra": "여행 중 휴대폰 충전 팁 요청"
      }
      `;

    const messages = [
      { role: "system", content: systemPrompt.trim() },
      { role: "user", content: `채팅 내역:\n${formattedHistory}\n\n현재 질문:\n${user_question}` }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
    });

    const parsing_result = JSON.parse(completion.choices[0].message.content.trim());
    console.log(parsing_result);

    if("travel_destination" in  parsing_result){
      const travel_destination_prompt = `
      너는 사용자의 여행 요청에 따라 여행지를 추천하는 전문가야.
      사용자의 요청을 분석해서 여행지를 추천하되, **"3곳 추천해줘", "여러 군데", "몇 군데"** 등 복수 요청이 없으면 1곳만 추천해. 복수 요청이 있으면 그것에 맞춰서 여러 곳 추천해줘.
      추천 결과는 항상 다음과 같은 **배열(JSON Array)** 형식으로 출력해야 해:
      [
        {
          "destination": "여행지 이름",
          "explanation": "추천 이유를 한 문장 이상으로 설명"
        },
        ...
      ]

      다른 텍스트, 설명, 마크다운 없이 **순수 JSON 배열만 출력**해야 한다. 다른 설명, 문장, 코드 블록 표시, 기호 \` 등을 절대 포함하지 않는다.
      `
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: travel_destination_prompt },
          { role: "user", content: `user request : ${parsing_result['travel_destination']}`}
        ]
      });

      let recommendedList;
      try {
        const raw = completion.choices[0].message.content.trim();
        recommendedList = JSON.parse(raw);
        console.log("추천된 여행지 목록:", recommendedList);
      } catch (e) {
        console.error("JSON 파싱 실패:", e);
      }
      
    }
    else{
      
    }



    return success(res, {
      code: 200,
      message: "Successfully generate prompt.",
      data: parsing_result
    });
  }

};
