import { VRMLookAtLoaderPlugin } from "@pixiv/three-vrm";
import { VRMLookAtSmoother } from "./VRMLookAtSmoother";
import { type VRMGLTF } from "~/types";

const NAME = "VRMLookAtSmootherLoaderPlugin";

export class VRMLookAtSmootherLoaderPlugin extends VRMLookAtLoaderPlugin {
  public get name(): string {
    return NAME;
  }

  public async afterRoot(gltf: VRMGLTF): Promise<void> {
    await super.afterRoot(gltf);

    const humanoid = gltf.userData.vrmHumanoid;
    const lookAt = gltf.userData.vrmLookAt;

    if (humanoid != null && lookAt != null) {
      const lookAtSmoother = new VRMLookAtSmoother(humanoid, lookAt.applier);
      lookAtSmoother.copy(lookAt);
      gltf.userData.vrmLookAt = lookAtSmoother;
    }
  }
}
