import type * as THREE from "three";
import { type VRM, type VRMExpressionPresetName } from "@pixiv/three-vrm";
import { ExpressionController } from "./expressionController";

/**
 * Emotional expression
 */
export class EmoteController {
  private _expressionController: ExpressionController;

  constructor(vrm: VRM, camera: THREE.Object3D) {
    this._expressionController = new ExpressionController(vrm, camera);
  }

  // Play the model's preset expressions
  public playEmotion(preset: VRMExpressionPresetName) {
    this._expressionController.playEmotion(preset);
  }

  // `preset` is always 'aa' now.
  public lipSync(preset: VRMExpressionPresetName, value: number) {
    this._expressionController.lipSync(preset, value);
  }

  // Each frame executes the function.
  public update(delta: number) {
    this._expressionController.update(delta);
  }
}
