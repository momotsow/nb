import type { MediaProvider } from "../media-provider";

const DEFAULT_SIZE = 1200;

/**
 * Local adapter: refs are paths under public/ (e.g. "brand/1.png") rendered
 * through next/image. The returned mediaRef is a root-relative path.
 */
export function createLocalMediaProvider(size: number = DEFAULT_SIZE): MediaProvider {
  return {
    toView(ref, alt) {
      const clean = ref.replace(/^\/+/, "");
      return { mediaRef: `/${clean}`, alt, width: size, height: size };
    },
  };
}
