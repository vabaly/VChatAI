import { atom } from "jotai";

export const isEarOffAtom = atom(true);
export const isForcePauseAtom = atom(false);
export const micAnalyserNodeAtom = atom<AnalyserNode | null>(null);
