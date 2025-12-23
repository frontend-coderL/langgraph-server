import { MessagesAnnotation } from "@langchain/langgraph";
import { createDeepSeekModel } from "../models/deepseek";
import { systemMessage } from "../prompts/system";
import { tools } from "../tools";

export const callModel = async (state: typeof MessagesAnnotation.State) => {
  // 初始化模型
  const model = createDeepSeekModel().bindTools(tools);

  // 构建消息
  const messages = [systemMessage, ...state.messages];

  const response = await model.invoke(messages);
  return { messages: [response] };
};
