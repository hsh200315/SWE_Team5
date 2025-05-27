const { success, failed } = require('../config/response');
const OpenAI = require("openai");
const { OPENAI_API_KEY } = require('../helpers/env');

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

module.exports = {
  promptGeneration: async (req, res) => {
    try {
      const { chat_history, user_question } = req.body;

      if (!chat_history || !user_question) {
        return failed(res, {
          code: 400,
          message: "chat_history와 user_question을 모두 포함해야 합니다.",
          error: 'Bad Request'
        });
      }

      // chat_history를 문자열로 변환
      const formattedHistory = chat_history.map(msg => `${msg.username}: ${msg.message}`).join('\n');

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
        { role: "user", content: `채팅 내역:\n${formattedHistory}\n\n현재 질문:\n${user_question}` }
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
      1. 여행지
      2. 관광 명소
      3. 교통편
      4. 항공편
      5. 숙소
      6. 음식점
      7. 그 외 (extra)

      사용자의 질문에는 하나 이상의 유형이 포함될 수 있고, 포함되지 않은 항목은 출력에 포함되지 않아야 한다. 각 항목은 아래와 같이 응답해야 한다:

      - 여행지: Brave API 검색에 적합하도록, 질문의 핵심 키워드만 뽑아 정제된 검색 문장을 생성해 제공한다.
      - 관광 명소: 마찬가지로 Brave API 검색에 적합한 명칭 또는 문장을 생성해 제공한다.
      - 교통편: 출발지와 도착지를 명시한다. 복수의 이동 경로가 포함되어 있다면 시간 순서대로 배열한다.
      - 항공편: 출발지와 도착지를 명시한다. 명시되지 않으면 출발지는 '서울', 도착지는 '없음'으로 기록한다.
      - 숙소: 검색 위치(지역명)가 명확하지 않은 경우 "{지역명}"으로 표시하고, 사용자의 의도를 포함하는 간단한 설명을 포함한다.
      - 음식점: 검색 위치(지역명)가 명확하지 않은 경우 "{지역명}"으로 표시하고, 관련 설명을 포함한다.
      - extra: 위 항목에 포함되지 않는 기타 여행 관련 요청이나 질문을 요약하여 제공한다.

      아래 형식은 예시이며, 출력 시에는 순수 JSON 객체만 출력해야 한다.

      {
        "여행지": "예시 응답",
        "관광 명소": "예시 응답",
        "교통편": [
          {"출발지": "남산타워", "도착지": "강남역"},
          {"출발지": "강남역", "도착지": "명동"}
        ],
        "항공편": {"출발지": "서울", "도착지": "오키나와"},
        "숙소": "제주 중문 바다 전망 숙소",
        "음식점": "대전 칼국수 맛집",
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

    const result = completion.choices[0].message.content.trim();
    console.log(JSON.parse(result));
    return success(res, {
      code: 200,
      message: "Successfully generate prompt.",
      data: result
    });
  }

};
