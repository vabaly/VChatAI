import { useMicVAD } from "@ricky0123/vad-react";
import { useContext, useEffect, useState } from "react";
import { ViewerContext } from "~/features/VRMViewer/viewerContext";
import { floatTo16BitPCM } from "~/utils";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { eventBus, EventList } from "~/events";
import { currentCharactersAtom, currentSceneModeAtom, isEarOffAtom, isForcePauseAtom, micAnalyserNodeAtom, userInfoAtom } from "~/atoms";
import { speechProcessor } from "~/features/speechProcessor";
import { SceneMode } from "~/types";

export const isManualPauseAtom = atom(false);

export function VoiceManagerInner ({
  mediaStream,
}: {
  mediaStream: MediaStream
}) {
  const { viewer } = useContext(ViewerContext);
  const setIsEarOff = useSetAtom(isEarOffAtom);
  const [isForcePause, setIsForcePause] = useAtom(isForcePauseAtom);
  const [isManualPause, setIsManualPause] = useAtom(isManualPauseAtom);
  const sceneMode = useAtomValue(currentSceneModeAtom);
  const characters = useAtomValue(currentCharactersAtom);
  const userInfo = useAtomValue(userInfoAtom);
  const { azureSpeechKey, azureSpeechRegion, azureOpenAIApiKey, azureOpenAIApiDeploymentName, azureOpenAIApiInstanceName, azureOpenAIApiVersion } = userInfo;

  const vad = useMicVAD({
    stream: mediaStream,
    startOnLoad: false,
    onSpeechEnd: async (speech) => {
      if (!azureSpeechKey || !azureSpeechRegion || !azureOpenAIApiKey || !azureOpenAIApiDeploymentName || !azureOpenAIApiInstanceName || !azureOpenAIApiVersion) {
        return;
      }
      // Send the content of this speech to the server, before stopping the new voice listening
      setIsForcePause(true);

      let loopPromise = Promise.resolve();
      if (sceneMode === SceneMode.AlienMode) {
        // Since there is a wait, the elvish language will start playing at this moment
        loopPromise = viewer.models[0]?.model.loopSpeakCosmicLanguage() ?? loopPromise;
      }

      const speechPCM = floatTo16BitPCM(speech);
      const responses = await speechProcessor({
        sceneMode,
        characters,
        data: speechPCM,
        azureSpeechKey,
        azureSpeechRegion,
        azureOpenAIApiKey,
        azureOpenAIApiInstanceName,
        azureOpenAIApiDeploymentName,
        azureOpenAIApiVersion,
      });
      if (!responses.length) {
        setIsForcePause(false);
        if (sceneMode === SceneMode.AlienMode) {
          viewer.models[0]?.model.stopLoopSpeakCosmicLanguage();
        }
        return;
      }

      if (sceneMode === SceneMode.SingleCharacterMode) {
        for (const response of responses) {
          const { audio, expression } = response;
          await viewer.models[0]?.model.speak(audio, expression);
        }
      } else if (sceneMode === SceneMode.AlienMode) {
        viewer.models[0]?.model.stopLoopSpeakCosmicLanguage();
        await loopPromise;
        await viewer.moveCameraToModel(1);
        for (const response of responses) {
          const { audio, expression } = response;
          await viewer.models[1]?.model.speak(audio, expression);
        }
        await viewer.moveCameraToModel(0);
      }
      setIsForcePause(false);
    },
  });

  const isListening = vad.listening;

  useEffect(() => {
    setIsEarOff(!isListening);
  }, [isListening, setIsEarOff]);

  useEffect(() => {
    if (isForcePause || isManualPause) {
      if (vad.listening) {
        vad.pause();
      }
    } else {
      vad.start();
    }
  }, [vad, isForcePause, isManualPause]);

  useEffect(() => {
    const startVad = () => {
      setIsManualPause(false);
    };
    const pauseVad = () => {
      setIsManualPause(true);
    };
    eventBus.addListener(EventList.StartVad, startVad);
    eventBus.addListener(EventList.PauseVad, pauseVad);

    return () => {
      eventBus.removeListener(EventList.StartVad, startVad);
      eventBus.removeListener(EventList.PauseVad, pauseVad);
    };
  }, [setIsManualPause]);

  return null;
}

export default function VoiceManager() {
  const [mediaStream, setMediaStream] = useState<MediaStream>();
  const setMicAnalyserNodeAtom = useSetAtom(micAnalyserNodeAtom);

  useEffect(() => {
    (async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          autoGainControl: true,
          noiseSuppression: true,
        },
      });
      const micAudioContext = new AudioContext();
      const micSourceNode = micAudioContext.createMediaStreamSource(stream);
      const micAnalyserNode = new AnalyserNode(micAudioContext);
      micAnalyserNode.fftSize = 1024;
      micSourceNode.connect(micAnalyserNode);
      setMicAnalyserNodeAtom(micAnalyserNode);
      setMediaStream(stream);
    })().catch(error => {
      console.error("getUserMedia error", error);
    });
  }, [setMicAnalyserNodeAtom]);

  return mediaStream ? <VoiceManagerInner mediaStream={mediaStream} /> : null;
}
