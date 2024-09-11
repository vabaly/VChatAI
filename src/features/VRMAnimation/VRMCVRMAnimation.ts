import { type VRMExpressionPresetName, type VRMHumanBoneName } from "@pixiv/three-vrm";

export interface VRMCVRMAnimation {
  specVersion: string;
  humanoid: {
    humanBones: {
      [name in VRMHumanBoneName]?: {
        node: number;
      };
    };
  };
  expressions?: {
    preset?: {
      [name in VRMExpressionPresetName]?: {
        node: number;
      };
    };
    custom?: Record<string, {
        node: number;
      }>;
  };
  lookAt?: {
    node: number;
  };
}
