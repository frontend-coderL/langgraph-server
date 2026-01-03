import { StateGraph } from "@langchain/langgraph";
import { AIMessage } from "@langchain/core/messages";
import { ConfigurationSchema } from "./config/schema";
import { callModel } from "./nodes/callModel";
import { toolNode } from "./nodes/tools";
import { processFile } from "./nodes/processFile";
import { GraphAnnotation } from "./state";

/**
 * Agent Workflow 定义
 */

// 路由函数：决定下一步是调用工具还是结束
const routeModelOutput = (state: typeof GraphAnnotation.State) => {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1] as AIMessage;

  if (lastMessage.tool_calls?.length) {
    return "tools";
  }

  return "__end__";
};

// 创建状态图
const workflow = new StateGraph(GraphAnnotation, ConfigurationSchema)
  // 添加节点
  .addNode("processFile", processFile)
  .addNode("callModel", callModel)
  .addNode("tools", toolNode)
  // 设置入口点
  .addEdge("__start__", "processFile")
  // 连接 processFile 到 callModel
  .addEdge("processFile", "callModel")
  // 设置条件边
  .addConditionalEdges("callModel", routeModelOutput)
  // 设置工具返回后的边
  .addEdge("tools", "callModel");

// 编译并导出图
export const graph = workflow.compile();
