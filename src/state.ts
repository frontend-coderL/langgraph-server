import { Annotation, MessagesAnnotation } from "@langchain/langgraph";

// 定义自定义 State Annotation
export const GraphAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  // 添加 pdf_content 字段
  pdf_content: Annotation<string>({
    reducer: (x, y) => y ?? x, // 保留最新的非空值
    default: () => "",
  }),
  lastMessageIsPdf: Annotation<boolean>({
    reducer: (x, y) => y ?? x, // 保留最新的非空值
    default: () => false,
  }),
});
