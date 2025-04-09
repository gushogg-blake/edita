export {default} from "./Editor.svelte";

type CanvasKey = "background" | "foldHilites" | "hilites" | "code" | "margin";

export type Canvases = {
	[K in CanvasKey]: HTMLCanvasElement;
};

export type Contexts = {
	[K in CanvasKey]: CanvasRenderingContext2D;
};
