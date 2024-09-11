import { Background } from "~/components/Background";
import { LoadingModal } from "~/components/LoadingModal";
import { VoiceManager } from "~/components/VoiceManager";
import { VRMViewer } from "~/components/VRMViewer";

export default function Home() {
  return (
    <>
      <Background />
      <LoadingModal />
      <VRMViewer />
      <VoiceManager />
    </>
  );
}
