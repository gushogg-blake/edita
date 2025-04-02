import type PlatformCommon from "platforms/common/Platform";
import Base from "base/Base";

declare global {
	module globalThis {
		var platform: PlatformCommon;
		var base: Base;
	}
}

export function setGlobals(Platform) {
	window.platform = new Platform();
	window.base = new Base();
}
