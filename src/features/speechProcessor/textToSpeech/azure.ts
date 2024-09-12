import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { type Character, type VRMFaceExpressionName } from "~/types";

const VRM_TO_AZURE_EXPRESSION: Record<VRMFaceExpressionName, string> = {
  happy: "cheerful",
  angry: "angry",
  sad: "sad",
  relaxed: "chat",
  // This one may take a little more trying, without the right tone of voice.
  surprised: "affectionate",
  neutral: "",
};

export async function azureTextToSpeech(
  content: string,
  expression: VRMFaceExpressionName = "neutral",
  character: Character,
  subscriptionKey: string,
  region: string,
) {
  const speechConfig = sdk.SpeechConfig.fromSubscription(
    subscriptionKey,
    region,
  );
  // const audioConfig = sdk.AudioConfig.fromSpeakerOutput()
  const speechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, null as unknown as sdk.AudioConfig);

  // https://learn.microsoft.com/zh-cn/azure/ai-services/speech-service/speech-synthesis-markup-voice
  const azureExpression = VRM_TO_AZURE_EXPRESSION[expression];
  const sound = character.sound || "zh-CN-XiaoxiaoNeural";
  // Using SSML to add mood to speech.
  const ssmlString = `
    <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="zh-CN">
      <voice name="${sound}">
        <mstts:express-as${
          azureExpression ? ` style="${azureExpression}"` : ""
        }>
          ${content}
        </mstts:express-as>
      </voice>
    </speak>
  `;

  const audio: ArrayBuffer = await new Promise((resolve, reject) => {
    speechSynthesizer.speakSsmlAsync(
      ssmlString,
      (result) => {
        speechSynthesizer.close();
        resolve(result.audioData);
      },
      (error) => {
        console.error("speakSsmlAsync", error);
        reject(error);
        speechSynthesizer.close();
      },
    );
  });

  return { audio };
}
