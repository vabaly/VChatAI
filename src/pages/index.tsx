import { Meta } from "~/components/Meta";
import dynamic from "next/dynamic";
import { Background } from "~/components/Background";
import { LoadingModal } from "~/components/LoadingModal";
import { VRMViewer } from "~/components/VRMViewer";
import { SettingDrawer } from "~/components/SettingDrawer";
import { KeySettingModal } from "~/components/KeySettingModal";

const VoiceManager = dynamic(() => import("~/components/VoiceManager"), { ssr: false });
const UIControllers = dynamic(() => import("~/components/UIControllers"), { ssr: false });

export default function Home() {
  return (
    <>
      <Meta />

      <Background />
      <LoadingModal />
      <VRMViewer />
      <VoiceManager />
      <UIControllers />
      <SettingDrawer />
      <KeySettingModal />
    </>
  );
}
