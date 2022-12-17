import Base from "modules/Base";
import Platform from "platforms/web/Platform";

window.platform = new Platform();
window.base = new Base({});

export default async function() {
	await platform.init({
		test: true,
	});
	
	await base.init();
	
	console.time("lang init");
	await Promise.all(["javascript", "html", "css", "php"].map(code => base.initLang(base.langs.get(code))));
	console.timeEnd("lang init");
}
