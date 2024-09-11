import * as THREE from "three";
import { type VRM, VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { type VRMAnimation } from "../VRMAnimation/VRMAnimation";
import { VRMLookAtSmootherLoaderPlugin } from "../VRMLookAtSmootherLoaderPlugin/VRMLookAtSmootherLoaderPlugin";
import { LipSync } from "../lipSync/lipSync";
import { EmoteController } from "../emoteController/emoteController";
import { type VRMGLTF, type LoaderHooks, type VRMFaceExpressionName } from "~/types";
import { characterAudioUrl, characterUrl } from "~/utils";

/**
 * Manage 3D characters.
 */
export class Model {
  public vrm?: VRM | null;
  public mixer?: THREE.AnimationMixer;
  public emoteController?: EmoteController;

  private _lookAtTargetParent: THREE.Object3D;
  private _lipSync?: LipSync;
  private _modelAudio?: ArrayBuffer;
  private _isLoopSpeakCosmic = false;

  constructor(lookAtTargetParent: THREE.Object3D) {
    // 1.1 Setting the character to look into the camera
    this._lookAtTargetParent = lookAtTargetParent;
    // 1.2 Setting the character's mouth synchronization
    this._lipSync = new LipSync(new AudioContext());
  }

  // 2. Load
  public async loadVRM(characterName: string, hooks?: LoaderHooks): Promise<void> {
    const url = characterUrl(characterName);
    const loader = new GLTFLoader();
    loader.register(
      (parser) =>
        new VRMLoaderPlugin(parser, {
          lookAtPlugin: new VRMLookAtSmootherLoaderPlugin(parser),
        })
    );

    hooks?.onStart?.();
    const gltf = await loader.loadAsync(url, (event) => {
      hooks?.onProgress?.(event.loaded / event.total);
    }) as VRMGLTF;
    hooks?.onEnd?.();

    const vrm = (this.vrm = gltf.userData.vrm);
    vrm.scene.name = "VRMRoot";

    VRMUtils.rotateVRM0(vrm);
    this.mixer = new THREE.AnimationMixer(vrm.scene);

    this.emoteController = new EmoteController(vrm, this._lookAtTargetParent);

    this.loadCosmicAudios(characterName);
  }

  public unloadVRM() {
    if (this.vrm) {
      VRMUtils.deepDispose(this.vrm.scene);
      this.vrm = null;
    }
  }

  /**
   * Load VRM animation, the specification of VRM animation is as follows：
   * https://github.com/vrm-c/vrm-specification/blob/master/specification/VRMC_vrm_animation-1.0/README.ja.md
   */
  public loadAnimation(vrmAnimation: VRMAnimation): void {
    const { vrm, mixer } = this;
    if (vrm == null || mixer == null) {
      throw new Error("You have to load VRM first");
    }

    const clip = vrmAnimation.createAnimationClip(vrm);
    const action = mixer.clipAction(clip);
    action.play();
  }

  public async speak(
    buffer: ArrayBuffer,
    expression: VRMFaceExpressionName,
  ) {
    this.emoteController?.playEmotion(expression);
    await new Promise((resolve) => {
      this._lipSync?.playFromArrayBuffer(buffer, () => {
        resolve(true);
      }).catch((error) => {
        console.error("playFromArrayBuffer error", error);
      });
    });
    // Restore natural expression.
    this.emoteController?.playEmotion("neutral");
  }

  private loadCosmicAudios(characterName: string) {
    const fileUrl = characterAudioUrl(characterName);
    fetch(fileUrl)
        .then(response => response.arrayBuffer())
        .then(buffer => {
          this._modelAudio = buffer;
        })
        .catch(error => {
          console.error("loadCosmicAudios error", error);
        });
  }

  // While waiting for a reply, play the Elvish, returning the status of whether or not the playback is complete.
  private async speakCosmicLanguage() {
    const audioBuffer = this._modelAudio;

    // Play a copy to avoid emptying the original object.
    if (audioBuffer) {
      await this.speak(audioBuffer.slice(0), "neutral");
    }
  }

  public async loopSpeakCosmicLanguage() {
    this._isLoopSpeakCosmic = true;

    while (this._isLoopSpeakCosmic) {
      await this.speakCosmicLanguage();
    }
  }

  public stopLoopSpeakCosmicLanguage () {
    this._isLoopSpeakCosmic = false;
  }

  // It's executed every frame.
  public update(delta: number): void {
    if (this._lipSync) {
      const { volume } = this._lipSync.update();
      this.emoteController?.lipSync("aa", volume);
    }

    this.emoteController?.update(delta);
    this.mixer?.update(delta);
    this.vrm?.update(delta);
  }
}
