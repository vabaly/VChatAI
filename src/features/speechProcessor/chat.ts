// https://js.langchain.com/v0.2/docs/tutorials/chatbot/

import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { HumanMessage } from "@langchain/core/messages";
import { AIMessagePromptTemplate, ChatPromptTemplate, HumanMessagePromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { RunnableWithMessageHistory, type RunnableLike } from "@langchain/core/runnables";
import { type SceneMode, type Character } from "~/types";
import { formatPrompt } from "~/utils";

// Prompts added to the end of character prompts.
export const PROMPT_END = formatPrompt`
  你回复我的格式是：“【表情】内容”，其中，表情只能根据内容从“自然”、“快乐”、“愤怒”、“悲伤”、“放松”中选一个，如果不知道选，就选“自然”。
  例如，你会回复我：“【快乐】我今天很开心。”你也可能回复我：“【自然】到吃饭时间了。”
  我的问题是：{input}
`;

const messageHistories: Record<string, InMemoryChatMessageHistory> = {};

export interface ChatParams {
  model: RunnableLike;
  character: Character;
  message: string;
  sceneMode: SceneMode;
}

function getPrompts(character: Character) {
  const { promptTemplate } = character;
  const rawPrompts = promptTemplate;

  const prompts = rawPrompts.map(({ role, content }) => {
    const fullContent = content + PROMPT_END;
    if (role === "ai") {
      return AIMessagePromptTemplate.fromTemplate(fullContent);
    } else {
      return HumanMessagePromptTemplate.fromTemplate(fullContent);
    }
  });
  return prompts;
}

function getConfig(sceneMode: SceneMode) {
  return {
    configurable: {
      sessionId: `${sceneMode}-default`,
    },
  };
}

export async function chatWithModel({
  model,
  character,
  message,
  sceneMode,
}: ChatParams) {

  const prompts = getPrompts(character);
    const chatPrompts = ChatPromptTemplate.fromMessages([
      new MessagesPlaceholder("history"),
      ...prompts,
      new HumanMessage(message),
    ]);

    const chain = chatPrompts.pipe(model);

    const withMessageHistory = new RunnableWithMessageHistory({
      runnable: chain,
      getMessageHistory: (sessionId: string) => {
        if (messageHistories[sessionId] === undefined) {
          messageHistories[sessionId] = new InMemoryChatMessageHistory();
        }
        return messageHistories[sessionId];
      },
      inputMessagesKey: "input",
      historyMessagesKey: "history",
    });

    const response = await withMessageHistory.invoke(
      {
        input: message,
      },
      getConfig(sceneMode),
    );

    return response.content;
}
