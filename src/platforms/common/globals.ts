import type Platform from "platforms/common/Platform";
import Base from "base/Base";

declare global {
	module globalThis {
		var platform: Platform;
		var base: Base;
	}
}

export function setGlobals(PlatformClass) {
	window.platform = new PlatformClass();
	window.base = new Base();
}
