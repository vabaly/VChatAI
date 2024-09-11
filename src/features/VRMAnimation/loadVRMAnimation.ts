import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { type VRMAnimation } from "./VRMAnimation";
import { VRMAnimationLoaderPlugin } from "./VRMAnimationLoaderPlugin";
import { type VRMGLTF } from "~/types";

const loader = new GLTFLoader();
loader.register((parser) => new VRMAnimationLoaderPlugin(parser));

export async function loadVRMAnimation(url: string): Promise<VRMAnimation | null> {
  const gltf = await loader.loadAsync(url, (event) => {
    const progress = event.loaded / event.total;
    console.log("loadVRMAnimation progress", progress);
  }) as VRMGLTF;

  // The data in the loaded vrma file contains instances of the VRMAnimation class to drive the character model.
  const vrmAnimations: VRMAnimation[] = gltf.userData.vrmAnimations;
  const vrmAnimation: VRMAnimation | undefined = vrmAnimations[0];

  return vrmAnimation ?? null;
}
