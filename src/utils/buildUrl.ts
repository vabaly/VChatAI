// import getConfig from "next/config";

import { CHARACTERS_DIR } from "~/constants";

/**
 * https://nextjs.org/docs/app/api-reference/next-config-js/runtime-configuration
 */
export function buildUrl(path: string): string {
  // const {
  //   publicRuntimeConfig,
  // }: {
  //   publicRuntimeConfig: { root: string };
  // } = getConfig()

  // The root directory may change if deployed in the future, it's not useful right now, but the ability to do so is reserved
  // return publicRuntimeConfig.root + path
  return path;
}

export function characterUrl(name: string) {
  return buildUrl(`${CHARACTERS_DIR}/${name}.vrm`);
}

export function characterImageUrl (name: string) {
  return buildUrl(`${CHARACTERS_DIR}/${name}.png`);
}

export function characterAudioUrl (name: string) {
  return buildUrl(`${CHARACTERS_DIR}/${name}.mp3`);
}
