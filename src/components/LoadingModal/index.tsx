import { Progress } from "@mantine/core";
import { useAtomValue } from "jotai";
import { LOADING_STEPS, currentLoadingProgressAtom, currentLoadingStepIndexAtom } from "~/hooks/useLoading";

export function LoadingModal () {
  const loadingProgress = useAtomValue(currentLoadingProgressAtom);
  const stepIndex = useAtomValue(currentLoadingStepIndexAtom);
  const step = LOADING_STEPS[stepIndex];

  if (loadingProgress >= 100) {
    return null;
  }

  return (
    <div className="z-50 fixed w-full h-full p-10 space-y-5 flex flex-col bg-green-50">
      <div
        className="bg-slate-200 flex-grow"
      />
      <div className="space-y-1">
        <Progress value={loadingProgress} />
        <p className="text-xs text-slate-500">{step} ...</p>
      </div>
    </div>
  );
};
