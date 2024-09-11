/**
 * @file Calculate the parameters of the camera based on the screen aspect and the ideal aspect of the model.
 */
import type * as THREE from "three";

// Fix the camera in the Z-axis position and then adjust the camera angle.
export const CAMERA_POSITION_Z = 1.5;

// Fix the maximum height of the model to avoid it being too large.
export const MODEL_MAX_HEIGHT = 648;

// Setting the safety zones above and below the model distance.
export const MODEL_SAFE_AREA = 20;

// Distance between two models.
export const MODEL_GAP = 0;

export enum CameraType {
  PerspectiveCamera,
  OrthographicCamera,
}

export interface GetCameraOptionsParams {
  canvasWidth: number
  canvasHeight: number
  modelSizes: (THREE.Vector3 | undefined)[]
}

export interface CameraOptions {
  cameraY: number
  modelsX: number[],
  maxModelSizeY: number

  // Temp values.
  yUp: number
  yDown: number
}

type CameraOptionsResult = Pick<CameraOptions, "cameraY" | "modelsX">
export interface PerspectiveCameraOptions extends CameraOptionsResult {
  cameraFov: number
}
export interface OrthographicCameraOptions extends CameraOptionsResult {
  top: number
  bottom: number
  left: number
  right: number
}

export function getCameraOptions (params: GetCameraOptionsParams): CameraOptions {
  const {
    canvasHeight,
    modelSizes,
  } = params;
  const safeContentHeight = canvasHeight - 2 * MODEL_SAFE_AREA;
  const isModelMaxHeightOverflow = safeContentHeight - MODEL_MAX_HEIGHT < 0;
  const modelHeight = isModelMaxHeightOverflow ? safeContentHeight : MODEL_MAX_HEIGHT;
  const maxModelSizeY = Math.max(...modelSizes.map(item => item?.y ?? 0));

  // Assume that the camera's lower ray is below the object at yDown and the upper ray is at yUp.
  // MODEL_SAFE_AREA : modelWidth = yDown : modelSize.y
  const yDown = MODEL_SAFE_AREA / modelHeight * maxModelSizeY;
  const yUp = (canvasHeight - modelHeight - MODEL_SAFE_AREA) / modelHeight * maxModelSizeY;
  // Since the bottom of the model is at (0, 0, 0), the camera Y-coordinate can be calculated as follows
  const cameraY = (yUp + maxModelSizeY - yDown) / 2;

  // Calculate how long the spacing between models is in the coordinate system.
  // MODEL_GAP : modelHeight = modelGapSize : maxModelSizeY
  const modelGapSize = MODEL_GAP / modelHeight * maxModelSizeY;

  // Calculate the coordinates of all models with the first model's X-coordinate as 0
  let startX = 0;
  const modelsX = modelSizes.map((item, index) => {
    if (!item) {
      return NaN;
    }
    if (index > 0) {
      const axisX = item.x / 2 + startX;
      startX = startX + item.x + modelGapSize;
      return axisX;
    } else {
      startX = item.x / 2 + modelGapSize;
      return 0;
    }
  });

  return {
    cameraY,
    modelsX,
    yUp,
    yDown,
    maxModelSizeY,
  };
}

export function getOrthographicCameraOptions(params: GetCameraOptionsParams): OrthographicCameraOptions {
  const { canvasWidth, canvasHeight } = params;
  const { yUp, yDown, maxModelSizeY, cameraY, modelsX } = getCameraOptions(params);

  const top = maxModelSizeY + yUp;
  const bottom = -yDown;
  const canvasAspectRatio = canvasWidth / canvasHeight;
  const cameraWidth = canvasAspectRatio * (top - bottom);
  const right = cameraWidth / 2;
  const left = -right;

  return {
    cameraY,
    top,
    bottom,
    left,
    right,
    modelsX,
  };
}
