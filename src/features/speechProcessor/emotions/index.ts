import { type VRMFaceExpressionName } from "~/types";

export interface ContentsWithExpression {
  expression: VRMFaceExpressionName;
  content: string;
}

const expressionMap = {
  自然: "neutral",
  快乐: "happy",
  愤怒: "angry",
  悲伤: "sad",
  放松: "relaxed",
};

const expressionDecodeMap = {
  neutral: "自然",
  happy: "快乐",
  angry: "愤怒",
  sad: "悲伤",
  relaxed: "放松",
};

export function splitStringByEmotions(str: string): ContentsWithExpression[] {
  const regex = /【(.*?)】(.*?)(?=【(.*?)】|$)/g;
  const result: ContentsWithExpression[] = [];

  const matches = str.match(regex);

  if (matches) {
    matches.forEach(function (match) {
      const rawExpression = match.match(/【(.*?)】/)?.[1];
      const expression = (expressionMap[rawExpression as keyof typeof expressionMap] || "neutral") as VRMFaceExpressionName;
      const content = match.replace(/【(.*?)】/, "");
      result.push({ expression, content });
    });
  } else {
    result.push({
      expression: "neutral",
      content: str,
    });
  }

  return result;
}

export const rebuildEmotionContent = (str: string): string => {
  const contents = splitStringByEmotions(str);
  const rebuildContent = contents
    .map((item) => {
      const { expression, content } = item;
      const expressionDecoded = expressionDecodeMap[expression as keyof typeof expressionDecodeMap];
      return `【${expressionDecoded}】${content}`;
    })
    .join("");

  return rebuildContent;
};
