export type MediaView = {
  mediaRef: string;
  alt: string;
  width: number;
  height: number;
};

/** UI depends only on this interface; vendor URLs/SDKs stay inside adapters. */
export interface MediaProvider {
  toView(ref: string, alt: string): MediaView;
}
