import { atom, useSetAtom } from "jotai";

export const LOADING_MODEL = "加载角色和动画";
export const LOADING_CORRECT_SCENE = "准备好场景";

export type StepType = typeof LOADING_MODEL | typeof LOADING_CORRECT_SCENE

export const LOADING_STEPS: StepType[] = [
  LOADING_MODEL,
  LOADING_CORRECT_SCENE,
];

export const getIndexByStep = (step: StepType) => LOADING_STEPS.indexOf(step);

export const currentLoadingStepIndexAtom = atom(0);
export const currentLoadingProgressAtom = atom(0);

export const useUpdateLoadingProgress = () => {
  const setStepIndex = useSetAtom(currentLoadingStepIndexAtom);
  const setProgress = useSetAtom(currentLoadingProgressAtom);

  return (step: StepType, stepProgress: number, isFinish?: boolean) => {
    const stepIndex = getIndexByStep(step);
    const stepLength = 1 / LOADING_STEPS.length;
    const progress = isFinish && stepIndex >= LOADING_STEPS.length - 1
      ? 100
      : Math.floor(100 * (stepLength * stepIndex + stepProgress * stepLength));

    setStepIndex(prevStepIndex => stepIndex > prevStepIndex ? stepIndex : prevStepIndex);
    setProgress(prevProgress => progress > prevProgress ? progress : prevProgress);
  };
};
