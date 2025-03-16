import path from "node:path";

export let dev = process.env.NODE_ENV === "development";
export let prod = !dev;
export let watch = process.env.ROLLUP_WATCH;
export let root = path.resolve(import.meta.dirname, "..");
export let platform = process.env.PLATFORM || "all";
