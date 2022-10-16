import Base from "modules/Base";
import Platform from "platforms/web/Platform";

window.platform = new Platform();
window.base = new Base({});

export default async function() {
	await platform.init({
		test: true,
	});
	
	await base.init();
	
	await Promise.all(["javascript", "html", "css", "php"].map(code => base.initLanguage(base.langs.get(code))));
}
