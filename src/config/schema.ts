import { Annotation } from "@langchain/langgraph";

export const ConfigurationSchema = Annotation.Root({
  // 这里可以定义配置项，例如 modelName
  modelName: Annotation<string>,
});
