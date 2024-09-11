import { ImageBgs, IMAGES_BG_PATH } from "~/constants";
import { buildUrl } from "~/utils";

export function Background() {
    return <div className="bg-cover bg-no-repeat bg-bottom w-[100vw] h-[100vh] fixed -z-20" style={{ backgroundImage: `url(${buildUrl(IMAGES_BG_PATH[ImageBgs.DEFAULT_HOME])})` }} />;
}
