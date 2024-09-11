import { atom } from "jotai";

export interface Character {
  id: string;
  name: string;
  nickname: string;
  slogan: string;
  promptTemplate: string;
  adaptSceneModes: string;
  sound: string;
}

export const totalCharactersAtom = atom<Character[]>([]);
