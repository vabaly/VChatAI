import { atom } from "jotai";
import { type Character } from "~/types";

export const totalCharactersAtom = atom<Character[]>([]);
