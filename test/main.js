import Base from "modules/Base";
import Platform from "platforms/web/Platform";

window.platform = new Platform();
window.base = new Base({});

export default async function(options) {
	await platform.init(options);
	await base.init();
}
