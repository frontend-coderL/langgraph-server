import { HumanMessage } from "@langchain/core/messages";
import { GraphAnnotation } from "../state";

// 直接解构导入 PDFParse 类
const { PDFParse } = require("pdf-parse");

export const processFile = async (state: typeof GraphAnnotation.State) => {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];

  // 只处理 HumanMessage
  if (!(lastMessage instanceof HumanMessage)) {
    return {};
  }

  // 检查 content 是否为数组（多模态消息通常是数组）
  if (!Array.isArray(lastMessage.content)) {
    return {};
  }

  const newContent: any[] = [];
  let hasPdf = false;
  let pdfText = "";

  for (const part of lastMessage.content) {
    if (part.type === "file" && part.mimeType === "application/pdf") {
      hasPdf = true;
      const filename = (part.metadata as any)?.filename || "unknown.pdf";
      console.log(`Processing PDF: ${filename}`);

      try {
        // 解码 base64 数据
        const buffer = Buffer.from(part.data as string, "base64");

        // 实例化 PDFParse 类
        // 注意：mehmet-kozan/pdf-parse 需要传入对象 { data: ... }
        const parser = new PDFParse({ data: buffer });
        const data = await parser.getText();

        if (!data.text || !data.text.trim()) {
          console.warn("PDF parsed but text is empty.");
          newContent.push({ type: "text", text: `<${filename}> (No Text Extracted - Possibly Scanned PDF)` });
        } else {
          // 清理文本中的控制字符等
          const cleanText = data.text.replace(/\x00/g, "");
          pdfText += `\n=== PDF CONTENT START: ${filename} ===\n${cleanText}\n=== PDF CONTENT END ===\n`;
          console.log(`PDF parsed successfully. Length: ${cleanText.length}`);
          newContent.push({ type: "text", text: `<${filename}> (Text Extracted)` });
        }
      } catch (error) {
        console.error("Error parsing PDF:", error);
        newContent.push({
          type: "text",
          text: `<${filename}> (Parse Error: ${error instanceof Error ? error.message : String(error)})`,
        });
      }
    } else {
      newContent.push(part);
    }
  }

  if (hasPdf) {
    console.log("PDF processed, updating state with pdf_content.");

    // 构造新的消息，隐藏 PDF 内容，只保留占位符
    const newMessage = new HumanMessage({
      content: newContent,
      id: lastMessage.id,
      name: lastMessage.name,
      additional_kwargs: lastMessage.additional_kwargs,
    });

    // 返回更新后的消息和 PDF 内容到 State
    return {
      messages: [newMessage],
      pdf_content: pdfText,
      lastMessageIsPdf: !pdfText,
    };
  }

  return {
    messages: [lastMessage],
    lastMessageIsPdf: false,
  };
};
