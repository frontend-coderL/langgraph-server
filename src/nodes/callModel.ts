import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createDeepSeekModel } from "../models/deepseek";
import { systemMessage } from "../prompts/system";
import { tools } from "../tools";
import { GraphAnnotation } from "../state";
import { Runnable } from "@langchain/core/runnables";

export const callModel = async (state: typeof GraphAnnotation.State) => {
  // 获取消息列表
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];

  // 判断上一条消息是否包含 PDF 内容（即刚才用户是否上传了 PDF）
  // 检查 lastMessage.content 中是否有 type: 'file'
  let lastMessageIsPdf = false;
  if (
    (lastMessage instanceof HumanMessage || lastMessage._getType() === "human") &&
    Array.isArray(lastMessage.content)
  ) {
    // 检查是否有 application/pdf
    lastMessageIsPdf = lastMessage.content.some(
      (part: any) => part.type === "file" && part.mimeType === "application/pdf"
    );
  }

  // 初始化模型，根据是否为 PDF 决定是否使用推理模型
  // 注意：deepseek-reasoner 不支持 function calling (tools)
  const useReasoning = lastMessageIsPdf;
  console.log(`Using reasoning model: ${useReasoning}`);

  let model: Runnable = createDeepSeekModel(useReasoning);

  // 只有非推理模型才绑定 tools，防止报错
  if (!useReasoning) {
    model = (model as any).bindTools(tools);
  }

  // 获取 PDF 内容
  const pdfContent = state.pdf_content;
  let finalSystemMessage = systemMessage;

  // 如果有 PDF 内容，拼接到 System Prompt 中
  if (pdfContent) {
    console.log("Injecting PDF content from state into System Prompt.");
    const systemNote =
      "\n\n[SYSTEM NOTE: The content of the uploaded PDF file(s) has been extracted and is attached below for your reference. User cannot see this extracted text, so please refer to it naturally.]\n";

    // 创建新的 SystemMessage，避免修改原始对象
    finalSystemMessage = new SystemMessage((systemMessage.content as string) + systemNote + pdfContent);
  }

  // 构建消息列表，并过滤掉 HumanMessage 中 content 数组里的 type === 'file' 项
  const finalMessages = [finalSystemMessage, ...state.messages].map((msg) => {
    // 检查是否为 HumanMessage 且 content 为数组
    if ((msg instanceof HumanMessage || msg._getType() === "human") && Array.isArray(msg.content)) {
      // 过滤掉 type 为 'file' 的部分
      const filteredContent = msg.content.filter((part: any) => part.type !== "file");

      // 如果内容被修改了，返回新的 HumanMessage
      if (filteredContent.length !== msg.content.length) {
        return new HumanMessage({
          ...msg,
          content: filteredContent,
        });
      }
    }
    return msg;
  });

  const response = await model.invoke(finalMessages);
  return { messages: [response] };
};
