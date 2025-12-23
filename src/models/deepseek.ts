import { ChatOpenAI } from "@langchain/openai";

export const createDeepSeekModel = () => {
  return new ChatOpenAI({
    model: "deepseek-chat",
    temperature: 0.7,
    configuration: {
      baseURL: "https://api.deepseek.com",
    },
    apiKey: process.env.DEEPSEEK_API_KEY,
  });
};
