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

async function askTourlist(allResults, extraInfo) {
  const systemPrompt = `
    너는 여행 전문가야. 아래 여러 지역의 관광지 후보 리스트를 보고 각 지역마다 사용자의 의도에 맞게 관광지를 추천해줘.
    반드시 다음과 같은 JSON 형태로 출력해:
    {
      "지역명1": [
        {"name": "장소명", "reason": "추천 이유", "url": "https://..."},
        ...
      ],
      "지역명2": [
        ...
      ]
    }
    다른 텍스트, 설명, 마크다운 없이 **순수 JSON 배열만 출력**해야 한다. 다른 설명, 문장, 코드 블록 표시, 기호 \` 등을 절대 포함하지 않는다.
  `;

  let userInput = `다음은 지역별 관광지 후보와 사용자의 요청이다:\n\n`;

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
    const finalResult = JSON.parse(raw);
    return finalResult;
  } catch (e) {
    console.error("JSON 파싱 실패:", e);
  }
}

module.exports = { streamChat, askTourlist };
