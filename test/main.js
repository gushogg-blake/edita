import components from "components";
import Base from "modules/Base";
import Platform from "./platform/Platform";

window.platform = new Platform();
window.base = new Base(components);

export default async function(options) {
	await platform.init(options);
	await base.init();
}
