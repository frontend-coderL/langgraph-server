import { TavilySearch } from "@langchain/tavily";
import { ChatOpenAI } from "@langchain/openai";
import { MessagesAnnotation, StateGraph, Annotation } from "@langchain/langgraph";
import { SystemMessage, AIMessage } from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";

/**
 * Agent 实现 - 使用 Tavily 搜索工具
 */

// --- 1. 定义工具 ---
// 使用 @langchain/tavily 包中的 TavilySearch
const tools = [
  new TavilySearch({
    maxResults: 3,
  }),
];

// --- 2. 定义 Configuration Schema ---
const ConfigurationSchema = Annotation.Root({
  // 这里可以定义配置项，例如 modelName
  modelName: Annotation<string>,
});

// --- 3. 定义节点函数 ---

// 3.1 调用模型节点
const callModel = async (state: typeof MessagesAnnotation.State) => {
  // 初始化模型
  const model = new ChatOpenAI({
    model: "deepseek-chat",
    temperature: 0.7,
    configuration: {
      baseURL: "https://api.deepseek.com",
    },
    apiKey: process.env.DEEPSEEK_API_KEY,
  }).bindTools(tools);

  // 构建消息
  const messages = [
    new SystemMessage("你是一个乐于助人的 AI 助手。你可以使用搜索工具来获取最新信息。"),
    ...state.messages,
  ];

  const response = await model.invoke(messages);
  return { messages: [response] };
};

// 3.2 路由函数
const routeModelOutput = (state: typeof MessagesAnnotation.State) => {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1] as AIMessage;

  if (lastMessage.tool_calls?.length) {
    return "tools";
  }

  return "__end__";
};

// --- 4. 创建状态图 ---
const workflow = new StateGraph(MessagesAnnotation, ConfigurationSchema)
  // Define the two nodes we will cycle between
  .addNode("callModel", callModel)
  .addNode("tools", new ToolNode(tools))
  // Set the entrypoint as `callModel`
  .addEdge("__start__", "callModel")
  .addConditionalEdges(
    // First, we define the edges' source node. We use `callModel`.
    "callModel",
    // Next, we pass in the function that will determine the sink node(s)
    routeModelOutput
  )
  // This means that after `tools` is called, `callModel` node is called next.
  .addEdge("tools", "callModel");

// --- 5. 编译并导出图 ---
export const graph = workflow.compile();
