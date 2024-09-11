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
  // 模型包围盒的尺寸大小
  modelSize: THREE.Vector3
}

/**
 * 通过 Three.js 创造一个视口
 */
export class Viewer {
  // 视口是否准备就绪了，包括场景、摄像机、渲染器的就绪
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
  // 当前摄像头正对着的模型
  private _currentModelIndex = 0;

  // 1. 初始化场景
  constructor() {
    this.isReady = false;

    // scene
    // 1.1 创建一个场景
    const scene = new THREE.Scene();
    this._scene = scene;

    // // Debug - 给场景中加上坐标辅助线
    // const axesHelper = new THREE.AxesHelper(1)
    // this._scene.add(axesHelper)

    // light
    // 1.2. 创建一束平行光，颜色是白色，强度是 0.6
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(1.0, 1.0, 1.0).normalize();
    scene.add(directionalLight);

    // 1.3. 创建一束环境光，颜色是白色，强度是 0.4，环境光会均匀照亮每一个物体，不会有阴影
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // clock
    // 1.4. 创建一个时钟，并且启动它，后续会结合 requestAnimationFrame 和 .getDelta 来获取每帧之间的时间
    this._clock = new THREE.Clock();
    this._clock.start();
  }

  /**
   * 设置 Canvas 为渲染器，同时加一个摄像机
   */
  public setup(canvas: HTMLCanvasElement) {
    if (this.isReady) {
      return;
    }
    // 2.1 获取 Canvas 的宽高
    const parentElement = canvas.parentElement;
    const width = parentElement?.clientWidth ?? canvas.width;
    const height = parentElement?.clientHeight ?? canvas.height;
    this._canvasWidth = width;
    this._canvasHeight = height;
    // renderer
    // 2.2 创建一个 WebGL 渲染器，渲染器渲染的内容会输出到指定的 Canvas 上面
    this._renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      // 启用抗锯齿
      antialias: true,
    });
    // 2.3 使用 SRGB 输出编码，最新已经默认已经是 SRGB 了
    // https://threejs.org/docs/index.html?q=webgl#api/zh/renderers/WebGLRenderer.outputColorSpace
    // this._renderer.outputColorSpace = THREE.SRGBColorSpace
    // 2.4 给渲染器设置成 Canvas 的宽高
    this._renderer.setSize(width, height);
    // 2.5 设置设备的像素比，避免模糊
    this._renderer.setPixelRatio(window.devicePixelRatio);

    // camera
    // // 2.6 创建一个透视摄像机，视野符合 Canvas 的宽高比
    // this._camera = new THREE.PerspectiveCamera(45.0, width / height, 0.1, 20.0)
    // 创建一个正交摄像机
    this._camera = new THREE.OrthographicCamera(
      -width / 2,
      width / 2,
      height / 2,
      -height / 2,
      0.1,
      20.0
    );
    // 2.7 设置摄像机的局部位置
    // 所谓局部位置，就是相对于父对象的位置，世界位置就是相对于 Scene 的位置
    // 由于 Scene 是根对象，因此 Scene 下的直接子物体的局部位置等于世界位置
    // this._camera.position.set(0, 1.3, CAMERA_POSITION_Z)
    this._camera.position.set(0, 0, CAMERA_POSITION_Z);

    // camera controls
    // 2.9 相机控制，使得相机能够围绕 canvas 进行转动或者某个轨道的运动
    this._cameraControls = new OrbitControls(
      this._camera,
      this._renderer.domElement
    );

    // this._cameraControls.addEventListener('change', (event) => {
    //   console.log('this._cameraControls change', event)
    //   console.log('this._cameraControls change camera', this._camera?.position, this._camera)
    // })

    // 禁止用户操控相机
    this._cameraControls.enabled = false;
    // 设置摄像机平移的方式，将在空间内平移
    this._cameraControls.screenSpacePanning = true;
    // 更新控制器，相机改变时调用
    this._cameraControls.update();

    // 2.12 窗口 resize 的事件
    window.addEventListener("resize", () => {
      this.resize();
    });
    // 2.13 渲染器和相机都准备好了
    this.isReady = true;
    // 2.14 调用 update 方法，将会在理论上每帧后都执行 update
    this.update();
  }

  // 4. 加载 VRM 文件
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
    // 4.1 每次都新的加载都得卸载之前的 VRM 模型
    this.unloadVRM();

    const { characters } = modeDetail;

    // 暂时用同一套站立动画，后续可能需要因角色而不同
    const commonAnimation = loadVRMAnimation(buildUrl(ANIMATIONS_PATH[Animations.IdleLoop]));
    // 并发加载多个角色模型
    const modelsLoads = characters.map(async ({ name }): Promise<ModelDetail | null> => {
      // 生成一个模型管理对象
      const model = new Model(this._camera ?? new THREE.Object3D());
      // 加载 VRM 模型和动画
      const [, vrma] = await Promise.all([
        model.loadVRM(name),
        commonAnimation,
      ]);

      if (!model?.vrm) return null;

      // 视锥体外的内容也需要渲染，避免临时渲染出现空白
      model.vrm.scene.traverse((obj) => {
        // 当这个设置了的时候，每一帧渲染前都会检测这个物体是不是在相机的视椎体范围内。
        // 如果设置为 false 物体不管是不是在相机的视椎体范围内都会渲染。默认为 true。
        obj.frustumCulled = false;
      });

      // // Debug - 显示模型的立方体
      // const boxHelper = new THREE.BoxHelper(model.vrm.scene)
      // // 创建新的材质，并设置颜色
      // const material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
      // boxHelper.material = material
      // model.vrm.scene.add(boxHelper) // 将包围盒辅助对象添加到 VRM 模型的父对象中

      // 4.5 将整个 vrm 加入到场景中
      this._scene.add(model.vrm.scene);

      if (vrma) model.loadAnimation(vrma);

      // 测量模型尺寸
      const modelBox = new THREE.Box3().setFromObject(model.vrm.scene);
      const modelSize = modelBox.getSize(new THREE.Vector3());

      return {
        model,
        modelSize,
      };
    });

    // 如果有模型加载失败，就失败吧，将会给个提示框，让用户重试
    // 只需要在组件中检测 models 哪几个为 null，就加载哪几个，小概率事件，先忽略
    const models = await Promise.all(modelsLoads);

    // 模型和动画加载完了
    modelHooks?.onProgress?.(1);

    this.models = models;

    console.log("this.models", models);

    this._isLoadingVRM = false;

    // HACK：下一帧调整相机位置，因为动画原点未对齐
    requestAnimationFrame(() => {
      this.resetCamera();
      // 场景矫正完了
      sceneHooks?.onEnd?.();
    });
  }

  // 卸载 VRM，只在这个类中使用
  private unloadVRM(): void {
    this.models.forEach((model) => {
      if (model?.model?.vrm) {
        this._scene.remove(model.model.vrm.scene);
        model.model.unloadVRM();
      }
    });

    this.models = [];
  }

  /**
   * 处理窗口缩放的事件
   */
  private resize() {
    if (!this._renderer) return;

    const parentElement = this._renderer.domElement.parentElement;
    if (!parentElement) return;

    // 重新设置渲染器的分辨率和宽高
    this._renderer.setPixelRatio(window.devicePixelRatio);
    this._renderer.setSize(
      parentElement.clientWidth,
      parentElement.clientHeight
    );

    this._canvasWidth = parentElement.clientWidth;
    this._canvasHeight = parentElement.clientHeight;

    if (!this._camera) return;

    // 透视相机需要设置的内容，重新设置相机视野的宽高比
    // this._camera.aspect =
    // parentElement.clientWidth / parentElement.clientHeight
    // this._camera.updateProjectionMatrix()

    this.resetCamera();
  }

  // 从这里开始，每帧都会执行 viewer 的 update 方法以及包括 model 等其他类的 update 方法
  private update = () => {
    requestAnimationFrame(this.update);
    const delta = this._clock.getDelta();

    // 如果有动画则更新动画
    TWEEN.update();
    for (const model of this.models) {
      // update vrm components
      model?.model?.update(delta);
    }

    // 将场景和相机渲染到渲染器上面，每一帧都要渲染新的内容
    if (this._renderer && this._camera) {
      this._renderer.render(this._scene, this._camera);
    }
  };

  /**
   * 移动摄像机，多角色模式时才需要
   * @param targetX 目标位置的 X 坐标
   */
  private moveCamera (targetX: number) {
    return new Promise((resolve) => {
      if (!this._camera) {
        resolve(false);
        return;
      }

      // 初始位置为摄像机当前位置
      const initialPosition = this._camera?.position.clone();
      // 目标位置
      const targetPosition = new THREE.Vector3(targetX, initialPosition.y, initialPosition.z);
      // 动画持续时间
      const duration = 1000;
      // 创建动画对象
      const tween = new TWEEN.Tween(initialPosition).to(targetPosition, duration);

      // 动画更新的回调函数，initialPosition 会变成那一帧的值，直接赋值给 camera
      tween.onUpdate(() => {
        this._camera?.position.copy(initialPosition);
      });

      tween.onComplete(() => {
        resolve(true);
      });

      tween.onStop(() => {
        resolve(true);
      });

      // 将运动方式设置为 EaseInEaseOut
      tween.easing(TWEEN.Easing.Quadratic.InOut);
      // 启动 Tween 动画
      tween.start();
    });
  }

  /**
   * 多模型模式下将移动摄像机到相应模型的位置
   */
  public async moveCameraToModel (index: number) {
      const targetX = this.models[index]?.model?.vrm?.scene?.position?.x;
      if (targetX !== undefined) {
        this._currentModelIndex = index;
        await this.moveCamera(targetX);
        this.lookAtCamera();
      }
  }

  // 使相机正对模型
  private lookAtCamera() {
    const index = this._currentModelIndex;
    const model = this.models[index]?.model;

    // 获得头部的位置
    const headNode = model?.vrm?.humanoid.getNormalizedBoneNode("head");
    const targetY = model?.vrm?.scene?.position?.y;

    if (headNode && targetY !== undefined) {
      const headWPos = headNode.getWorldPosition(new THREE.Vector3());
      // 控制相机
      this._cameraControls?.target.set(headWPos.x, targetY, headWPos.z);
      this._cameraControls?.update();
    }
  }

  /**
   * 设置模型的尺寸和位置，设置相机的尺寸，在首次、resize 的时候都得执行
   */
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
      // 更新相机的投影矩阵使角度生效
      this._camera.updateProjectionMatrix();
    }

    // 设置模型的位置
    this.models.forEach((model, index) => {
      const modelX = modelsX[index];
      if (model && !Number.isNaN(modelX)) {
        model.model.vrm?.scene.position.setX(modelX!);
      }
    });

    this.lookAtCamera();
  }
}
