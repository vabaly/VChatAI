import { type VRMExpressionPresetName, type VRM, type VRMHumanoid, type VRMLookAt } from "@pixiv/three-vrm";
import { type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { type VRMAnimation } from "~/features/VRMAnimation/VRMAnimation";

export interface VRMGLTF extends GLTF {
  userData: {
    vrmHumanoid: VRMHumanoid | null;
    vrmLookAt: VRMLookAt | null;
    vrm: VRM;
    vrmAnimations: VRMAnimation[];
  }
}

export interface LoaderHooks {
  onStart?: () => void
  onProgress?: (progress: number) => void
  onEnd?: () => void
}

export enum SceneMode {
  SingleCharacterMode = "SingleCharacterMode",
  AlienMode = "AlienMode",
}

export interface UserInfo {
  singleCharacterId: string;
  alienCharacterId: string;
  alienTranslatorId: string;
  sceneMode: SceneMode;
  // Azure configs
  azureSpeechKey: string;
  azureSpeechRegion: string;
  azureOpenAIApiKey: string;
  azureOpenAIApiInstanceName: string;
  azureOpenAIApiDeploymentName: string;
  azureOpenAIApiVersion: string;
}

export interface Character {
  id: string;
  name: string;
  nickname: string;
  slogan: string;
  promptTemplate: PromptTemplateItem[];
  adaptSceneModes: SceneMode[];
  sound: string;
}

export type ModeDetail = Pick<UserInfo, "sceneMode"> & {
  characters: Character[]
}

export type VRMFaceExpressionName = Extract<
  VRMExpressionPresetName,
  "happy" | "angry" | "sad" | "relaxed" | "surprised" | "neutral"
>

export type PromptRole = "ai" | "human"
export interface PromptTemplateItem {
  role: PromptRole
  content: string
}
export type PromptTemplateList = PromptTemplateItem[]

export interface SpeechResponse {
  expression: VRMFaceExpressionName
  content: string
  audio: ArrayBuffer
}

