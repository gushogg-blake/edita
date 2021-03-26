let {isClient} = require("../checkEnvironment");
let {on} = require("./domEvents");
let bodyClickOrMousedown = require("./bodyClickOrMousedown");

let mousedown = bodyClickOrMousedown();

if (isClient) {
	on(document.body, "mousedown", mousedown.handle);
}

module.exports = mousedown;
