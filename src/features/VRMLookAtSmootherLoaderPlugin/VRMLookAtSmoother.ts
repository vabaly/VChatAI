import { type VRMHumanoid, VRMLookAt, type VRMLookAtApplier } from "@pixiv/three-vrm";
import * as THREE from "three";

/** Minimum interval before saccade occurs */
const SACCADE_MIN_INTERVAL = 0.5;

/**
 * Probability of saccade occurrence
 */
const SACCADE_PROC = 0.05;

/** The range radius of the saccade, passed to lookAt, not the actual radius of movement of the eyeball, so it should be slightly larger. in degrees. */
const SACCADE_RADIUS = 5.0;

const _v3A = new THREE.Vector3();
const _quatA = new THREE.Quaternion();
const _eulerA = new THREE.Euler();

/**
 * Add the following functionality to `VRMLookAt`
 *
 * - If `userTarget` is assigned, it will turn in the direction of the user with smoothing.
 * - Turn not only with eyes, but also with head rotation.
 * - Add eye saccade motion.
 */
export class VRMLookAtSmoother extends VRMLookAt {
  /** Coefficient for smoothing */
  public smoothFactor = 4.0;

  /** Angle at the limit of user orientation in degrees */
  public userLimitAngle = 90.0;

  /** Orientation to the user. The originally existing `target` is used for animation. */
  public userTarget?: THREE.Object3D | null;

  public enableSaccade: boolean;

  private _saccadeYaw = 0.0;

  private _saccadePitch = 0.0;

  private _saccadeTimer = 0.0;

  private _yawDamped = 0.0;

  private _pitchDamped = 0.0;

  private _tempFirstPersonBoneQuat = new THREE.Quaternion();

  public constructor(humanoid: VRMHumanoid, applier: VRMLookAtApplier) {
    super(humanoid, applier);

    this.enableSaccade = true;
  }

  public update(delta: number): void {
    if (this.target && this.autoUpdate) {
      this.lookAt(this.target.getWorldPosition(_v3A));

      const yawAnimation = this._yaw;
      const pitchAnimation = this._pitch;

      let yawFrame = yawAnimation;
      let pitchFrame = pitchAnimation;

      if (this.userTarget) {
        this.lookAt(this.userTarget.getWorldPosition(_v3A));

        if (
          this.userLimitAngle < Math.abs(this._yaw) ||
          this.userLimitAngle < Math.abs(this._pitch)
        ) {
          this._yaw = yawAnimation;
          this._pitch = pitchAnimation;
        }

        const k = 1.0 - Math.exp(-this.smoothFactor * delta);
        this._yawDamped += (this._yaw - this._yawDamped) * k;
        this._pitchDamped += (this._pitch - this._pitchDamped) * k;

        const userRatio =
          1.0 -
          THREE.MathUtils.smoothstep(
            Math.sqrt(
              yawAnimation * yawAnimation + pitchAnimation * pitchAnimation
            ),
            30.0,
            90.0
          );

        yawFrame = THREE.MathUtils.lerp(
          yawAnimation,
          0.6 * this._yawDamped,
          userRatio
        );
        pitchFrame = THREE.MathUtils.lerp(
          pitchAnimation,
          0.6 * this._pitchDamped,
          userRatio
        );

        _eulerA.set(
          -this._pitchDamped * THREE.MathUtils.DEG2RAD,
          this._yawDamped * THREE.MathUtils.DEG2RAD,
          0.0,
          VRMLookAt.EULER_ORDER
        );
        _quatA.setFromEuler(_eulerA);

        const head = this.humanoid.getRawBoneNode("head")!;
        this._tempFirstPersonBoneQuat.copy(head.quaternion);
        head.quaternion.slerp(_quatA, 0.4);
        head.updateMatrixWorld();
      }

      if (this.enableSaccade) {
        if (
          SACCADE_MIN_INTERVAL < this._saccadeTimer &&
          Math.random() < SACCADE_PROC
        ) {
          this._saccadeYaw = (2.0 * Math.random() - 1.0) * SACCADE_RADIUS;
          this._saccadePitch = (2.0 * Math.random() - 1.0) * SACCADE_RADIUS;
          this._saccadeTimer = 0.0;
        }

        this._saccadeTimer += delta;

        yawFrame += this._saccadeYaw;
        pitchFrame += this._saccadePitch;

        this.applier.applyYawPitch(yawFrame, pitchFrame);
      }

      this._needsUpdate = false;
    }

    if (this._needsUpdate) {
      this._needsUpdate = false;
      this.applier.applyYawPitch(this._yaw, this._pitch);
    }
  }

  public revertFirstPersonBoneQuat(): void {
    if (this.userTarget) {
      const head = this.humanoid.getNormalizedBoneNode("head")!;
      head.quaternion.copy(this._tempFirstPersonBoneQuat);
    }
  }
}
