declare module 'bwip-js' {
  export interface ToCanvasOptions {
    bcid: string;
    text: string;
    scale?: number;
    height?: number;
    width?: number;
    includetext?: boolean;
    eclevel?: number;
    [key: string]: any;
  }

  export function toCanvas(
    canvas: HTMLCanvasElement | string,
    options: ToCanvasOptions,
    callback?: (err?: Error | string) => void
  ): void;
}
