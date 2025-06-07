const { success, failed } = require('../utils/response');
const OpenAI = require("openai");
const { OPENAI_API_KEY, BRAVE_API_KEY } = require('../config/env');
const { getSearchResult, getPlacesByTextSearch, collectTourist, collectPlaces, getAllTransitDirections, processIATA, searchFlights } = require('../utils/utils');
const { askTourlist, askAccommodation, askRestaurant, parseUserQuestion } = require("../AI_model/chat_ai");
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
        - 만약 LLM이 답변을 도출할 때 필요한 정보가 부족하다면 어떤 정보가 포함되어야 하는지 알려줘야 해.
        - 생략된 지명, 일정, 동행 여부, 관심사 등이 대화에 있다면 반드시 반영해.
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
    let recommendedList;
    let tourist;
    let accommodation;
    let restaurant;
    let transportation;
    let flight;
    const parsing_result = parseUserQuestion(chat_history, user_question);

    if("travel_destination" in  parsing_result){
        recommendedList = recommendDestinations(parsing_result.travel_destination);
      if("tourist_attraction" in parsing_result){
        const results = await collectTourist(recommendedList);
        tourist = await askTourlist(results, parsing_result.extra);
      }
    }
    else{
      if("tourist_attraction" in parsing_result){
        recommendedList = parsing_result.tourist_attraction;
        const results = await collectTourist(recommendedList);
        recommendedList = await askTourlist(results, parsing_result.extra);
      }
    }

    if("accommodation" in parsing_result && parsing_result.accommodation != 'x'){
      const results = await collectPlaces(parsing_result.accommodation, recommendedList);
      accommodation = await askAccommodation(results, parsing_result.extra);
    }

    if("restaurant" in parsing_result && parsing_result.restaurant != 'x'){
      const results = await collectPlaces(parsing_result.restaurant, recommendedList);
      restaurant = await askRestaurant(results, parsing_result.extra);
    }

    if("transportation" in parsing_result && parsing_result.transportation != 'x'){
      transportation = await getAllTransitDirections(parsing_result.transportation);
    }

    if("flight" in parsing_result && parsing_result.flight.destination != 'x'){
      function formatDateForSkyscanner(dateStr) {
        return dateStr.replace(/-/g, '');
      }
      const processedFlights = await processIATA(parsing_result.flight, recommendedList);
  
      const finalFlights = [];

      for (const flight of processedFlights) {
        const offers = await searchFlights(
          flight.departure_iata,
          flight.destination_iata,
          flight.departure_date
        );
        const skyscannerUrl = `https://www.skyscanner.co.kr/transport/flights/${flight.departure_iata.toLowerCase()}/${flight.destination_iata.toLowerCase()}/${formatDateForSkyscanner(flight.departure_date)}/`;

        finalFlights.push({
          ...flight,
          offers: offers,
          url: skyscannerUrl
        });
      }

      flight = finalFlights;
    }

    return success(res, {
      code: 200,
      message: "Successfully generate prompt.",
      data: parsing_result
    });
  }

};
