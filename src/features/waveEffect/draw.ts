/**
 * @file What the wave effect should look like in each frame of the drawing
 */

const DRAW_CONFIG = {
  barWidth: 1,
  barColor: ["#FFFFFF", "#868e96"],
  // The angle at which the brush moves each time
  angle: Math.PI * 1.5,
  arcStep: 2,
  lineWidth: 1,
  lineSpace: 1,
  waveSpace: 50,
};

export interface WaveDrawOptions {
  outlineWidth: number
  radius: number
  analyser: AnalyserNode | null
  isEarOff?: boolean
}

// Drawing the outline of a circle.
function drawOutline(context: CanvasRenderingContext2D, circleX: number, circleY: number, options: WaveDrawOptions) {
  if (options.outlineWidth === 0) {
    return;
  }

  context.beginPath();
  context.strokeStyle = "#868e96";
  context.lineWidth = options.outlineWidth;

  context.arc(circleX, circleY, options.radius, 0, 2 * Math.PI);
  context.stroke();
}

// Color gradient for radar chart bars
function setBarColor(context: CanvasRenderingContext2D, canvasWidth: number, circleX: number, circleY: number){
  if (!Array.isArray(DRAW_CONFIG.barColor)) {
    return DRAW_CONFIG.barColor;
  }
  const gradient = context.createRadialGradient(circleX, circleY, canvasWidth / 2, circleX, circleY, 0);
  let offset = 0;

  DRAW_CONFIG.barColor.forEach(color => {
    gradient.addColorStop(offset, color);
    offset += (1 / DRAW_CONFIG.barColor.length);
  });
  return gradient;
}

// What should be drawn in each frame of the radar chart.
export function waveDraw(
  canvas: HTMLCanvasElement,
  options: WaveDrawOptions,
) {
  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  const originWidth = canvas.offsetWidth;
  const originHeight = canvas.offsetHeight;
  const scaleWidth = canvas.offsetWidth * window.devicePixelRatio;
  const scaleHeight = canvas.offsetHeight * window.devicePixelRatio;
  canvas.width = scaleWidth;
  canvas.height = scaleHeight;
  context.scale(window.devicePixelRatio, window.devicePixelRatio);

  const circleX = originWidth / 2;
  const circleY = originHeight / 2;

  context.clearRect(0, 0, originWidth, originHeight);

  drawOutline(context, circleX, circleY, options);

  const { analyser, isEarOff } = options;

  // Without an audio node or without listening, the following is not drawn.
  if (!analyser || isEarOff) {
    return;
  }

  const originData = new Uint8Array(analyser.fftSize);
  analyser.getByteFrequencyData(originData);

  // Subtract 50 from the value of each element in the data to avoid noise.
  const data = new Uint8Array(analyser.fftSize);
  const noise = 50;
  // In order to distribute the audio fluctuations evenly,
  // the non-zero portion needs to be minimized by first finding the last position that is greater than zero.
  const lastLargeThanZeroIndex = originData.reduce((lastIndex, item, index) => {
    if (item - noise > 0) {
      return index;
    }

    return lastIndex;
  }, 0);
  for (let index = 0; index < data.length; index++) {
    const originValue = originData[index % (lastLargeThanZeroIndex + DRAW_CONFIG.waveSpace)];
    const value = Math.max(0, originValue! - noise);
    data[index] = value;
  }

  const dataLen = data.length;
  const step = ((DRAW_CONFIG.lineWidth + DRAW_CONFIG.lineSpace) / dataLen) * (2 * Math.PI);


  context.lineWidth = DRAW_CONFIG.barWidth;
  context.strokeStyle = setBarColor(context, originWidth, circleX, circleY);

  let angle = DRAW_CONFIG.angle;
  for (let i = 0; i < dataLen; i++) {
    angle += step;
    // Skip rectangles to be combined.
    if (i % DRAW_CONFIG.arcStep) {
      continue;
    }

    // Averaging several sampling points together.
    const bits = Math.round(data.slice(i, i + DRAW_CONFIG.arcStep)
      .reduce((v, t) => t + v, 0) / DRAW_CONFIG.arcStep);

    const barLength = originWidth / 2 - options.radius;
    const shapeLength = options.radius + (bits / 255.0 * barLength);

    context.beginPath();

    const moveToX = options.radius * Math.cos(angle) + circleX;
    const moveToY = options.radius * Math.sin(angle) + circleY;
    context.moveTo(moveToX, moveToY);
    const lineToX = shapeLength * Math.cos(angle) + circleX;
    const lineToY = shapeLength * Math.sin(angle) + circleY;
    context.lineTo(lineToX, lineToY);
    context.stroke();
  }
}
