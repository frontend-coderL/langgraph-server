import { ChatOpenAI } from "@langchain/openai";

export const createDeepSeekModel = (useReasoning = false) => {
  return new ChatOpenAI({
    model: useReasoning ? "deepseek-reasoner" : "deepseek-chat",
    temperature: useReasoning ? 1 : 0.7, // 深度思考模型建议 temperature 为 1（或默认），chat 模型为 0.7
    configuration: {
      baseURL: "https://api.deepseek.com",
    },
    apiKey: process.env.DEEPSEEK_API_KEY,
  });
};
