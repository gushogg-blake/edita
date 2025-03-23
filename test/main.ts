import Base from "modules/base/Base";
import Platform from "platforms/web/Platform";

declare global {
	module globalThis {
		var platform: Platform;
		var base: Base;
	}
}

window.platform = new Platform();
window.base = new Base({});

export default async function() {
	await platform.init({
		test: true,
	});
	
	await base.init();
	
	await Promise.all(["javascript", "html", "css", "php"].map(code => base.initLang(base.langs.get(code))));
}
