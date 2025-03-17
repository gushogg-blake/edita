import path from "node:path";

export let watch = process.env.ROLLUP_WATCH;
export let dev = !!watch || process.env.NODE_ENV === "development";
export let prod = !dev;
export let root = path.resolve(import.meta.dirname, "..");
export let platform = process.env.PLATFORM || "all";
