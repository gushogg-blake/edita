let {app: electronApp} = require("electron");
let {spawn} = require("child_process");
let path = require("path");
let chokidar = require("chokidar");
let fs = require("./modules/fs");

function debounce(fn, delay) {
	let timer;
	
	return function() {
		clearTimeout(timer);
		
		timer = setTimeout(fn, delay);
	}
}

module.exports = async function(app) {
	let watchRenderer = chokidar.watch(path.resolve(__dirname, "../public"), {
		ignoreInitial: true,
		
		ignored: [
			path.resolve(__dirname, "../public/dialogs"),
			path.resolve(__dirname, "../public/build/dialogs"),
		],
	});
	
	let watchDialogs = (await fs(__dirname, "../dialogs").ls()).map(function({name}) {
		let watcher = chokidar.watch([
			path.resolve(__dirname, "../public/dialogs/" + name + ".html"),
			path.resolve(__dirname, "../public/build/dialogs/" + name),
			path.resolve(__dirname, "../public/build/global.css"),
		]);
		
		watcher.on("change", function() {
			for (let appWindow of app.appWindows) {
				for (let dialogWindow of Object.values(app.dialogsByAppWindowAndName.get(appWindow))) {
					dialogWindow.reload();
				}
			}
		});
		
		return watcher;
	});
	
	let watchMain = chokidar.watch(__dirname);
	
	let watchers = [
		watchMain,
		watchRenderer,
		...watchDialogs,
	];
	
	watchRenderer.on("change", function() {
		app.appWindows.forEach(browserWindow => browserWindow.reload());
	});
	
	watchMain.on("change", debounce(function() {
		let child = spawn("npm", ["run", "electron"], {
			detached: true,
			stdio: "inherit",
		});
		
		child.unref();
		
		closeWatchers();
		
		app.forceQuit();
	}, 300));
	
	function closeWatchers() {
		watchers.forEach(w => w.close());
	}
	
	electronApp.on("before-quit", closeWatchers);
}
