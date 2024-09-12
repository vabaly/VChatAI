import { ViewerContext } from "~/features/VRMViewer/viewerContext";
import { LOADING_MODEL, LOADING_CORRECT_SCENE, useUpdateLoadingProgress } from "~/hooks/useLoading";
import { useAtomValue } from "jotai";
import { useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { currentCharactersAtom, currentSceneModeAtom } from "~/atoms";

export function VRMViewer() {
  const sceneMode = useAtomValue(currentSceneModeAtom);
  const characters = useAtomValue(currentCharactersAtom);
  const currentModeDetail = useMemo(() => ({
    sceneMode,
    characters,
  }), [sceneMode, characters]);
  const { viewer } = useContext(ViewerContext);
  const updateLoadingProgress = useUpdateLoadingProgress();
  const firstLoadedRef = useRef(false);

  const canvasRef = useCallback(
    (canvas: HTMLCanvasElement) => {
      if (canvas) {
        viewer.setup(canvas);
        viewer.loadVRM(currentModeDetail, {
          modelHooks: {
            onProgress: (progress) => updateLoadingProgress(LOADING_MODEL, progress),
          },
          sceneHooks: {
            onProgress: (progress) => updateLoadingProgress(LOADING_CORRECT_SCENE, progress),
            onEnd: () => updateLoadingProgress(LOADING_CORRECT_SCENE, 1),
          },
        }).catch(error => {
          console.error("loadVRM error", error);
        });
        firstLoadedRef.current = true;
      }
    },
    [viewer, currentModeDetail, updateLoadingProgress]
  );

  useEffect(() => {
    if (viewer && firstLoadedRef.current && currentModeDetail) {
      viewer.loadVRM(currentModeDetail, {}).catch(error => {
        console.error("loadVRM error", error);
      });
    }
  }, [viewer, currentModeDetail]);

  return (
    <div className={"absolute top-0 left-0 w-full h-full -z-10 overflow-hidden"}>
      <canvas ref={canvasRef} className={"h-full w-full"}></canvas>
    </div>
  );
}
