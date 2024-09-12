import { AzureChatOpenAI } from "@langchain/openai";
import { azureSpeechToText } from "./speechToText/azure";
import { splitStringByEmotions } from "./emotions";
import { type Character, SceneMode, type SpeechResponse, type UserInfo } from "~/types";
import { chatWithModel } from "./chat";
import { azureTextToSpeech } from "./textToSpeech/azure";

export interface SpeechParams extends Omit<UserInfo, "singleCharacterId" | "alienCharacterId" | "alienTranslatorId"> {
  characters: Character[];
  data: ArrayBuffer;
}

export async function speechProcessor({
  sceneMode,
  characters,
  data,
  azureSpeechKey,
  azureSpeechRegion,
  azureOpenAIApiKey,
  azureOpenAIApiInstanceName,
  azureOpenAIApiDeploymentName,
  azureOpenAIApiVersion,
}: SpeechParams): Promise<SpeechResponse[]> {
  try {
    const textCharacter = characters[0];

    if (!textCharacter) {
      return [];
    }

    const text = await azureSpeechToText(data, azureSpeechKey, azureSpeechRegion);

    if (!text) {
      return [];
    }

    // Content is currently all first character replies
    const audioCharacter =
      sceneMode === SceneMode.AlienMode ? characters[1] : characters[0];

    const model = new AzureChatOpenAI({
      azureOpenAIApiKey,
      azureOpenAIApiInstanceName,
      azureOpenAIApiDeploymentName,
      azureOpenAIApiVersion,
    });

    const responseContent = await chatWithModel({
      model,
      character: textCharacter,
      message: text,
      sceneMode,
    });

    if (!responseContent) {
      return [] as SpeechResponse[];
    }

    const contentsWithExpressions = splitStringByEmotions(String(responseContent));

    const responses: SpeechResponse[] = [];
    // Alien mode with a voice-over effect.
    if (sceneMode === SceneMode.AlienMode) {
      contentsWithExpressions.unshift({
        expression: "neutral",
        content: `${textCharacter?.nickname}说，`,
      });
    }
    for (const contentWithExpression of contentsWithExpressions) {
      const { expression = "neutral", content } = contentWithExpression;
      const audio = await azureTextToSpeech(
        content,
        expression,
        audioCharacter,
        azureSpeechKey,
        azureSpeechRegion,
      );

      responses.push({
        expression,
        content,
        audio: audio.audio,
      });
    }

    // Only return valid response.
    return responses.filter((item) => item.content && item.audio);
  } catch (error) {
    console.error("speechProcessor error", error);
    return [] as SpeechResponse[];
  }
}
