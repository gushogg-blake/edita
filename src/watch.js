let electron = require("electron");
let {spawn} = require("child_process");
let chokidar = require("chokidar");
let fs = require("flowfs");

function debounce(fn, delay) {
	let timer;
	
	return function() {
		clearTimeout(timer);
		
		timer = setTimeout(fn, delay);
	}
}

let watch = chokidar.watch([
	"public/index.html",
	"public/global.css",
	"src/modules/ipc",
	"src/config.js",
	"src/main.js",
	"src/watch.js",
].map(p => fs(__dirname, "..", p).path));

watch.on("change", debounce(function() {
	let child = spawn("npm", ["run", "electron-dev"], {
		cwd: __dirname,
		detached: true,
		stdio: "inherit",
	});
	
	child.unref();
	
	electron.app.quit();
}, 300));
