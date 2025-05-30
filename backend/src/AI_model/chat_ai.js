const { ChatOpenAI } = require("langchain/chat_models/openai");
const { HumanMessage } = require("langchain/schema");
const { OPENAI_API_KEY } = require('../helpers/env');


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

module.exports = { streamChat };
