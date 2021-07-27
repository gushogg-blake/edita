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
	"../../../modules/ipc",
	"config.js",
	"main.js",
	"watch.js",
].map(p => fs(__dirname, p).path));

watch.on("change", debounce(function() {
	let child = spawn("npm", ["run", "pure-electron-dev"], {
		cwd: __dirname,
		detached: true,
		stdio: "inherit",
	});
	
	child.unref();
	
	electron.app.quit();
}, 300));
