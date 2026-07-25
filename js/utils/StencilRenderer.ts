import type { WebGLRenderer } from "three/src/renderers/WebGLRenderer.js";

export type StencilFunc = [number, number, number]

export interface StencilState {
    state: (enabled: boolean) => void
    func: [StencilFunc, StencilFunc]
    op: [StencilFunc, StencilFunc]
}

export type StencilRenderer = Omit<WebGLRenderer, 'debug'> & {
    debug: { stencil: StencilState } & Record<string, unknown>
}
