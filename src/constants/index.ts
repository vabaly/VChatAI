// Location relative to the `public` folder.
export const IMAGES_DIR = "/images";

export enum ImageBgs {
  DEFAULT_HOME = "default-home",
}
export const IMAGES_BG_PATH = {
  [ImageBgs.DEFAULT_HOME]: `${IMAGES_DIR}/${ImageBgs.DEFAULT_HOME}.jpg`,
};

export const CHARACTERS_DIR = "/characters";

// File names are consistent with animation names.
export enum Animations {
  IdleLoop = "idleLoop",
}
export const ANIMATIONS_DIR = "/animations";
export const ANIMATIONS_PATH = Object.values(Animations).reduce((result, item) => {
  return {
    ...result,
    [item]: `${ANIMATIONS_DIR}/${item}.vrma`,
  };
}, {} as Record<Animations, string>);
