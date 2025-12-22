import { ChatOpenAI } from "@langchain/openai";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { SystemMessage } from "@langchain/core/messages";

/**
 * 这是一个最简单的 Agent 实现
 * 它接收用户输入，调用 LLM，并返回结果
 */

// 1. 定义节点函数
// 这个函数将作为图中的一个节点运行
const callModel = async (state: typeof MessagesAnnotation.State) => {
  // 初始化模型
  // 使用 DeepSeek 大模型
  // DeepSeek 兼容 OpenAI SDK，只需配置 baseURL 和 apiKey
  const model = new ChatOpenAI({
    model: "deepseek-chat", // 或者 "deepseek-reasoner"
    temperature: 0.7,
    configuration: {
      baseURL: "https://api.deepseek.com",
    },
    apiKey: process.env.DEEPSEEK_API_KEY,
  });

  // 如果没有系统消息，可以在这里添加（可选）
  const messages = [new SystemMessage("你是一个乐于助人的 AI 助手。"), ...state.messages];

  // 调用模型
  const response = await model.invoke(messages);

  // 返回更新的状态
  // MessagesAnnotation 会自动处理消息的追加
  return { messages: [response] };
};

// 2. 创建状态图
const workflow = new StateGraph(MessagesAnnotation)
  // 添加节点
  .addNode("agent", callModel)
  // 设置入口点：图从哪里开始
  .addEdge("__start__", "agent")
  // 设置出口点：图在哪里结束
  .addEdge("agent", "__end__");

// 3. 编译并导出图
// 这个导出的 graph 将被 langgraph-cli 使用
export const graph = workflow.compile();
