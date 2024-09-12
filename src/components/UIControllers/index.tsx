import { useAtomValue, useSetAtom } from "jotai";
import { LuEar, LuEarOff, LuMic, LuSettings } from "react-icons/lu";
import { isEarOffAtom, isForcePauseAtom, micAnalyserNodeAtom } from "~/atoms";
import { useEffect, useState } from "react";
import { waveDraw } from "~/features/waveEffect/draw";
import { ActionIcon } from "@mantine/core";
import { eventBus, EventList } from "~/events";
import { isShowSettingAtom } from "../SettingDrawer";

export default function UIControllers () {
  const isEarOff = useAtomValue(isEarOffAtom);
  const isForcePause = useAtomValue(isForcePauseAtom);
  const EarIconComponent = isEarOff ? LuEarOff : LuEar;
  const [micCanvas, setMicCanvas] = useState<HTMLCanvasElement | null>(null);
  const micAnalyserNode = useAtomValue(micAnalyserNodeAtom);
  const setIsShowSetting = useSetAtom(isShowSettingAtom);

  const switchIsEarOff = () => {
    if (isEarOff) {
      eventBus.emit(EventList.StartVad);
    } else {
      eventBus.emit(EventList.PauseVad);
    }
  };

  const openSettingDrawer = () => {
    setIsShowSetting(true);
  };

  useEffect(() => {
    let frame = 0;

    const drawUpdate = () => {
      if (micCanvas) {
        // Draw at least once.
        waveDraw(micCanvas, {
          outlineWidth: 1,
          radius: 10,
          analyser: micAnalyserNode,
          isEarOff,
        });

        // The wave will only start to be displayed when listening, and is drawn every frame.
        if (micAnalyserNode && !isEarOff) {
          frame = requestAnimationFrame(drawUpdate);
        }
      }
    };

    drawUpdate();

    return () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }
    };
  }, [micCanvas, micAnalyserNode, isEarOff]);

  return (
    <>
      <div className="fixed left-2 top-2 space-y-2">
        <ActionIcon variant="default" size={"lg"} disabled={isForcePause} onClick={switchIsEarOff}>
          <EarIconComponent className="h-4 w-4" />
        </ActionIcon>
      </div>
      <div className="fixed right-2 top-2 space-y-2">
        <div
          className="relative w-[2.125rem] h-[2.125rem] border-[0.0625rem] border-transparent rounded-[0.25rem] flex items-center justify-center"
          style={{
            backgroundColor: "rgba(248, 249, 250, 1)",
            color: "#868e96",
          }}
        >

          <LuMic
            className="w-3 h-3 absolute left-[50%] top-[50%]"
            style={{
              transform: "translate(-50%, -50%)",
            }}
          />
          <canvas
            className="w-7 h-7"
            ref={setMicCanvas}
          />
        </div>
        <ActionIcon variant="default" size={"lg"} onClick={openSettingDrawer}>
          <LuSettings className="h-4 w-4" />
        </ActionIcon>
      </div>
    </>
  );
}
