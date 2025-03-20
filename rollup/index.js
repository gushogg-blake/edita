import {platform} from "./env.js";

import electronMain from "./electronMain.js";
import electronRenderer from "./electronRenderer.js";
import web from "./web.js";
import test from "./test.js";

let builds = [];

if (platform === "all" || platform === "electron") {
	builds = builds.concat(electronMain);
	builds = builds.concat(electronRenderer);
}

if (platform === "all" || platform === "web") {
	builds = builds.concat(web);
}

if (platform === "all" || platform === "test") {
	builds = builds.concat(test);
}

export default builds;
