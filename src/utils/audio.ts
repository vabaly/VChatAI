export function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
  const arrayBuffer = new ArrayBuffer(input.length * 2);
  const dataView = new DataView(arrayBuffer);
  let offset = 0;
  for (const sampleValue of input) {
    const sampleValueProcessed = Math.max(-1, Math.min(1, sampleValue));
    const sampleValueMapped = sampleValueProcessed < 0 ? sampleValueProcessed * 0x8000 : sampleValueProcessed * 0x7FFF;
    dataView.setInt16(offset, sampleValueMapped);
    offset += 2;
  }

  return arrayBuffer;
}

// Turn each character of the String into an 8-bit unsigned integer (ASCII code), and store it in the ArrayBuffer.
function writeString(dataView: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    dataView.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Refer to https://github.com/mattdiamond/Recorderjs/blob/master/src/recorder.js#L155C22-L155C31
export function PCMToWAV(
  arrayBuffer: ArrayBuffer,
  options?: {
    numChannels?: number;
    sampleRate?: number;
  },
) {
  const { numChannels = 1, sampleRate = 16000 } = options ?? {};
  const wavArrayBuffer = new ArrayBuffer(44 + arrayBuffer.byteLength);
  const dataView = new DataView(wavArrayBuffer);

  /* RIFF identifier */
  writeString(dataView, 0, "RIFF");
  /* RIFF chunk length */
  dataView.setUint32(4, 36 + arrayBuffer.byteLength, true);
  /* RIFF type */
  writeString(dataView, 8, "WAVE");
  /* format chunk identifier */
  writeString(dataView, 12, "fmt ");
  /* format chunk length */
  dataView.setUint32(16, 16, true);
  /* sample format (raw) */
  dataView.setUint16(20, 1, true);
  /* channel count */
  dataView.setUint16(22, numChannels, true);
  /* sample rate */
  dataView.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  dataView.setUint32(28, sampleRate * 4, true);
  /* block align (channel count * bytes per sample) */
  dataView.setUint16(32, numChannels * 2, true);
  /* bits per sample */
  dataView.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(dataView, 36, "data");
  /* data chunk length */
  dataView.setUint32(40, arrayBuffer.byteLength, true);

  // TODO: an error -> error RangeError: byte length of Int16Array should be a multiple of 2
  const originInt16Array = new Int16Array(arrayBuffer);
  let offset = 44;
  // Take each value and assign it to the wavArrayBuffer via the dataView.
  for (const sampleValue of originInt16Array) {
    dataView.setInt16(offset, sampleValue);
    offset += 2;
  }

  return wavArrayBuffer;
}
