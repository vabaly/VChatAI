import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { totalCharactersAtom } from "./character";

enum SceneMode {
  SingleCharacterMode = "SingleCharacterMode",
  AlienMode = "AlienMode",
}

interface UserInfo {
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

export const userInfoAtom = atomWithStorage<Partial<UserInfo>>("userInfo", {});

export const updateUserInfoAtom = atom(null, (get, set, partialUser: Partial<UserInfo>) => {
  const userInfo = get(userInfoAtom);
  const newUserInfo = {
    ...userInfo,
    ...partialUser,
  };
  set(userInfoAtom, newUserInfo);
});

export const currentSceneModeAtom = atom(get => {
  const userInfo = get(userInfoAtom);
  return userInfo?.sceneMode ?? SceneMode.SingleCharacterMode;
}, (_, set, newSceneMode: SceneMode) => {
  const sceneModeInfo: Partial<UserInfo> = {
    sceneMode: newSceneMode,
  };
  set(updateUserInfoAtom, sceneModeInfo);
});

export const currentCharactersAtom = atom((get) => {
  const userInfo = get(userInfoAtom);
  const totalCharacters = get(totalCharactersAtom);
  const { sceneMode, singleCharacterId, alienCharacterId, alienTranslatorId } = userInfo;

  if (sceneMode === SceneMode.SingleCharacterMode) {
    if (singleCharacterId) {
      const character = totalCharacters.find(item => item.id === singleCharacterId);
      return [character!];
    } else {
      const character = totalCharacters.find(item => item.adaptSceneModes.includes(SceneMode.SingleCharacterMode));
      return [character!];
    }
  } else if (sceneMode === SceneMode.AlienMode) {
    const alienCharacter = alienCharacterId
      ? totalCharacters.find(item => item.id === alienCharacterId)
      : totalCharacters.find(item => (
        item.adaptSceneModes.length === 1 &&
        item.adaptSceneModes.includes(SceneMode.AlienMode)
      ));
    const alienTranslator = alienTranslatorId
      ? totalCharacters.find(item => item.id === alienTranslatorId)
      : totalCharacters.find(item => (
        item.adaptSceneModes.length > 1 &&
        item.adaptSceneModes.includes(SceneMode.AlienMode)
      ));
    return [alienCharacter!, alienTranslator!];
  } else {
    return [];
  }
});
