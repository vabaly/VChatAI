import * as THREE from "three";
import * as TWEEN from "@tweenjs/tween.js";
import { Model } from "./model";
import { loadVRMAnimation } from "../VRMAnimation/loadVRMAnimation";
import { buildUrl } from "~/utils";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { ANIMATIONS_PATH, Animations } from "~/constants";
import { type LoaderHooks, type ModeDetail } from "~/types";
import { CAMERA_POSITION_Z, getOrthographicCameraOptions } from "./cameraOptions";

export interface ModelDetail {
  model: Model
  modelSize: THREE.Vector3
}

export class Viewer {
  // Includes scene, camera, and renderer ready
  public isReady: boolean;
  public models: (ModelDetail | null)[] = [];

  private _renderer?: THREE.WebGLRenderer;
  private _clock: THREE.Clock;
  private _scene: THREE.Scene;
  private _camera?: THREE.OrthographicCamera;
  private _cameraControls?: OrbitControls;
  private _canvasWidth = 0;
  private _canvasHeight = 0;
  private _isLoadingVRM = false;
  // The model that the current camera is facing
  private _currentModelIndex = 0;

  constructor() {
    this.isReady = false;

    // scene
    const scene = new THREE.Scene();
    this._scene = scene;

    // // Debug
    // const axesHelper = new THREE.AxesHelper(1)
    // this._scene.add(axesHelper)

    // light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(1.0, 1.0, 1.0).normalize();
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // clock
    this._clock = new THREE.Clock();
    this._clock.start();
  }

  public setup(canvas: HTMLCanvasElement) {
    if (this.isReady) {
      return;
    }
    const parentElement = canvas.parentElement;
    const width = parentElement?.clientWidth ?? canvas.width;
    const height = parentElement?.clientHeight ?? canvas.height;
    this._canvasWidth = width;
    this._canvasHeight = height;
    // renderer
    this._renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
    });
    this._renderer.setSize(width, height);
    this._renderer.setPixelRatio(window.devicePixelRatio);

    // camera
    this._camera = new THREE.OrthographicCamera(
      -width / 2,
      width / 2,
      height / 2,
      -height / 2,
      0.1,
      20.0
    );
    this._camera.position.set(0, 0, CAMERA_POSITION_Z);

    // camera controls
    this._cameraControls = new OrbitControls(
      this._camera,
      this._renderer.domElement
    );

    this._cameraControls.enabled = false;
    this._cameraControls.screenSpacePanning = true;
    this._cameraControls.update();

    window.addEventListener("resize", () => {
      this.resize();
    });
    this.isReady = true;
    this.update();
  }

  public async loadVRM(modeDetail: ModeDetail, {
    modelHooks,
    sceneHooks,
  }: {
    modelHooks?: LoaderHooks
    sceneHooks?: LoaderHooks
  }) {
    if (this._isLoadingVRM) {
      return;
    }
    this._isLoadingVRM = true;
    this.unloadVRM();

    const { characters } = modeDetail;

    // Same set of standing animations for now, may need to be different for subsequent characters.
    const commonAnimation = loadVRMAnimation(buildUrl(ANIMATIONS_PATH[Animations.IdleLoop]));
    const modelsLoads = characters.map(async (character): Promise<ModelDetail | null> => {
      const model = new Model(this._camera ?? new THREE.Object3D());
      const [, vrma] = await Promise.all([
        model.loadVRM(character),
        commonAnimation,
      ]);

      if (!model?.vrm) return null;

      model.vrm.scene.traverse((obj) => {
        obj.frustumCulled = false;
      });

      // // Debug
      // const boxHelper = new THREE.BoxHelper(model.vrm.scene)
      // const material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
      // boxHelper.material = material
      // model.vrm.scene.add(boxHelper)

      this._scene.add(model.vrm.scene);

      if (vrma) model.loadAnimation(vrma);

      const modelBox = new THREE.Box3().setFromObject(model.vrm.scene);
      const modelSize = modelBox.getSize(new THREE.Vector3());

      return {
        model,
        modelSize,
      };
    });

    // A dialog will be given to the user to try again
    const models = await Promise.all(modelsLoads);

    modelHooks?.onProgress?.(1);

    this.models = models;
    this._isLoadingVRM = false;

    // HACK：The next frame adjusts the camera position because the animation origin is not aligned
    requestAnimationFrame(() => {
      this.resetCamera();
      sceneHooks?.onEnd?.();
    });
  }

  private unloadVRM(): void {
    this.models.forEach((model) => {
      if (model?.model?.vrm) {
        this._scene.remove(model.model.vrm.scene);
        model.model.unloadVRM();
      }
    });

    this.models = [];
  }

  private resize() {
    if (!this._renderer) return;

    const parentElement = this._renderer.domElement.parentElement;
    if (!parentElement) return;

    this._renderer.setPixelRatio(window.devicePixelRatio);
    this._renderer.setSize(
      parentElement.clientWidth,
      parentElement.clientHeight
    );

    this._canvasWidth = parentElement.clientWidth;
    this._canvasHeight = parentElement.clientHeight;

    if (!this._camera) return;

    this.resetCamera();
  }

  private update = () => {
    requestAnimationFrame(this.update);
    const delta = this._clock.getDelta();

    TWEEN.update();
    for (const model of this.models) {
      // update vrm components
      model?.model?.update(delta);
    }

    if (this._renderer && this._camera) {
      this._renderer.render(this._scene, this._camera);
    }
  };

  /**
   * Moving camera, required for more than one character.
   * @param targetX
   */
  private moveCamera (targetX: number) {
    return new Promise((resolve) => {
      if (!this._camera) {
        resolve(false);
        return;
      }

      const initialPosition = this._camera?.position.clone();
      const targetPosition = new THREE.Vector3(targetX, initialPosition.y, initialPosition.z);
      const duration = 1000;
      const tween = new TWEEN.Tween(initialPosition).to(targetPosition, duration);

      tween.onUpdate(() => {
        this._camera?.position.copy(initialPosition);
      });

      tween.onComplete(() => {
        resolve(true);
      });

      tween.onStop(() => {
        resolve(true);
      });

      tween.easing(TWEEN.Easing.Quadratic.InOut);
      tween.start();
    });
  }

  public async moveCameraToModel (index: number) {
      const targetX = this.models[index]?.model?.vrm?.scene?.position?.x;
      if (targetX !== undefined) {
        this._currentModelIndex = index;
        await this.moveCamera(targetX);
        this.lookAtCamera();
      }
  }

  private lookAtCamera() {
    const index = this._currentModelIndex;
    const model = this.models[index]?.model;

    const headNode = model?.vrm?.humanoid.getNormalizedBoneNode("head");
    const targetY = model?.vrm?.scene?.position?.y;

    if (headNode && targetY !== undefined) {
      const headWPos = headNode.getWorldPosition(new THREE.Vector3());
      this._cameraControls?.target.set(headWPos.x, targetY, headWPos.z);
      this._cameraControls?.update();
    }
  }

  private resetCamera() {
    const modelSizes = this.models.map(item => item?.modelSize);

    const cameraFrustum = getOrthographicCameraOptions({
      canvasWidth: this._canvasWidth,
      canvasHeight: this._canvasHeight,
      modelSizes,
    });
    const { left, right, top, bottom, modelsX } = cameraFrustum;

    if (this._camera) {
      this._camera.left = left;
      this._camera.right = right;
      this._camera.top = top;
      this._camera.bottom = bottom;
      this._camera.updateProjectionMatrix();
    }

    this.models.forEach((model, index) => {
      const modelX = modelsX[index];
      if (model && !Number.isNaN(modelX)) {
        model.model.vrm?.scene.position.setX(modelX!);
      }
    });

    this.lookAtCamera();
  }
}
