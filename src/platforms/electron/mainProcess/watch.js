let {app} = require("electron");
let {spawn} = require("child_process");
let path = require("path");
let chokidar = require("chokidar");

function debounce(fn, delay) {
	let timer;
	
	return function() {
		clearTimeout(timer);
		
		timer = setTimeout(fn, delay);
	}
}

let watch = chokidar.watch([
	"ipc",
	"config.js",
	"main.js",
	"watch.js",
].map(p => path.join(__dirname, p)));

watch.on("change", debounce(function() {
	let child = spawn("npm", ["run", "electron"], {
		cwd: __dirname,
		detached: true,
		stdio: "inherit",
	});
	
	child.unref();
	
	watch.close();
	
	app.quit();
}, 300));

app.on("before-quit", function() {
	watch.close();
});
