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

      const systemPrompt = `"""
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
  }
};
