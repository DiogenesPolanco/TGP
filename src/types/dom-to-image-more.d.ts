declare module 'dom-to-image-more' {
  interface Options {
    width?: number
    height?: number
    style?: Record<string, string>
  }
  export function toBlob(node: HTMLElement, options?: Options): Promise<Blob>
}
