let {isClient} = require("../checkEnvironment");
let {on} = require("./domEvents");
let bodyClickOrMousedown = require("./bodyClickOrMousedown");

let click = bodyClickOrMousedown();

if (isClient) {
	on(document.body, "click", click.handle);
}

module.exports = click;
