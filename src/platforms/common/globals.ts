import type PlatformCommon from "platforms/common/Platform";
import {Base} from "base";
import type App from "ui/App";

declare global {
	module globalThis {
		var platform: PlatformCommon;
		var base: Base;
		
		// debug
		var app: App | undefined;
		
		// electron
		var ELECTRON_DISABLE_SECURITY_WARNINGS: boolean;
	}
}

export function setGlobals(Platform) {
	window.platform = new Platform();
	window.base = new Base();
}
