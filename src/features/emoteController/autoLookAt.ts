import * as THREE from "three";
import { type VRM } from "@pixiv/three-vrm";
/**
 * Line of sight control
 */
export class AutoLookAt {
  private _lookAtTarget: THREE.Object3D;
  constructor(vrm: VRM, camera: THREE.Object3D) {
    this._lookAtTarget = new THREE.Object3D();
    camera.add(this._lookAtTarget);

    // Make the model look at this added object
    if (vrm.lookAt) vrm.lookAt.target = this._lookAtTarget;
  }
}
