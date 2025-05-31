const { ChatOpenAI } = require("langchain/chat_models/openai");
const { HumanMessage } = require("langchain/schema");
const { OPENAI_API_KEY } = require('../config/env');


async function streamChat({ input, chatList, onToken, onDone }) {
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
  //console.log(input);
  //console.log(chatList);
  await model.call([new HumanMessage(input)]);
}

module.exports = { streamChat };
