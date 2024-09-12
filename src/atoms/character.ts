import { atom } from "jotai";
import { totalCharacters } from "~/configs";
import { type Character } from "~/types";

export const totalCharactersAtom = atom<Character[]>(totalCharacters);
