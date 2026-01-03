import { MessagesAnnotation } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";

const { PDFParse } = require("pdf-parse");

export const processFile = async (state: typeof MessagesAnnotation.State) => {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];

  // 只处理 HumanMessage
  if (!(lastMessage instanceof HumanMessage)) {
    return { messages: [] };
  }

  // 检查 content 是否为数组（多模态消息通常是数组）
  if (!Array.isArray(lastMessage.content)) {
    return { messages: [] };
  }

  const newContent: any[] = [];
  let hasPdf = false;
  let pdfText = "";
  let pdfParseFailed = false;

  for (const part of lastMessage.content) {
    if (part.type === "file" && part.mimeType === "application/pdf") {
      hasPdf = true;
      const filename = (part.metadata as any)?.filename || "unknown.pdf";
      console.log(`Processing PDF: ${filename}`);

      try {
        // 解码 base64 数据
        const buffer = Buffer.from(part.data as string, "base64");

        // 参考 callModel.ts 中的用法
        const pdf = new PDFParse({ data: buffer });
        const data = await pdf.getText();

        if (!data.text || !data.text.trim()) {
          console.warn("PDF parsed but text is empty.");
          pdfParseFailed = true;
          // 解析失败，保留原样或者给个提示？
          // 用户要求改为 { type: "text", text: "<filename.pdf>" }
          // 即使失败，也按要求替换，后续可能加错误提示
          newContent.push({ type: "text", text: `<${filename}> (Parse Failed)` });
        } else {
          pdfText += `\n--- Begin of PDF Content: ${filename} ---\n${data.text}\n--- End of PDF Content ---\n`;
          newContent.push({ type: "text", text: `<${filename}>` });
        }
      } catch (error) {
        console.error("Error parsing PDF:", error);
        pdfParseFailed = true;
        newContent.push({ type: "text", text: `<${filename}> (Parse Error)` });
      }
    } else {
      newContent.push(part);
    }
  }

  if (hasPdf) {
    // 如果有解析出的文本，追加到 content 中
    if (pdfText) {
      newContent.push({ type: "text", text: pdfText });
    }

    // 如果解析失败，可能需要通知用户，或者就在 content 里体现（上面已经加了 Parse Failed 标记）

    // 返回更新后的消息，保持 ID 以覆盖原消息
    // 注意：如果 lastMessage 没有 id，LangGraph 可能会生成新的。
    // 但作为 HumanMessage 输入，通常应该尽量保持一致性。
    // 如果没有 ID，我们也没办法，只能返回新的。
    const newMessage = new HumanMessage({
      content: newContent,
      id: lastMessage.id,
      name: lastMessage.name,
      additional_kwargs: lastMessage.additional_kwargs,
    });

    return { messages: [newMessage] };
  }

  return { messages: [] };
};
