import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { PCMToWAV } from "~/utils";


export async function azureSpeechToText(
  arrayBuffer: ArrayBuffer,
  azureSpeechKey: string,
  azureSpeechRegion: string,
): Promise<string> {
  return new Promise((resolve) => {
    const wavArrayBuffer = PCMToWAV(arrayBuffer);

    const speechConfig = sdk.SpeechConfig.fromSubscription(
      azureSpeechKey,
      azureSpeechRegion,
    );
    speechConfig.speechRecognitionLanguage = "zh-CN";
    const pushStream = sdk.AudioInputStream.createPushStream();

    pushStream.write(wavArrayBuffer.slice(0));
    pushStream.close();

    const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
    const speechRecognizer = new sdk.SpeechRecognizer(
      speechConfig,
      audioConfig,
    );
    speechRecognizer.recognizeOnceAsync((result) => {
      const text = result.text;
      resolve(text);
      speechRecognizer.close();
    });
  });
}
