import {setContext, getContext} from "svelte";
import type {App} from "ui/app";

export function setApp(app: App) {
	setContext("app", app);
}

export function getApp(): App {
	return getContext("app") as App;
}
