let {app: electronApp} = require("electron");
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

module.exports = function(app) {
	let watchRenderer = chokidar.watch(path.resolve(__dirname, "../public"), {
		ignoreInitial: true,
	});
	
	let watchMain = chokidar.watch(__dirname);
	
	let watchers = [watchMain, watchRenderer];
	
	watchRenderer.on("change", function() {
		app.appWindows.forEach(win => win.reload());
	});
	
	watchMain.on("change", debounce(function() {
		let child = spawn("npm", ["run", "electron"], {
			detached: true,
			stdio: "inherit",
		});
		
		child.unref();
		
		closeWatchers();
		
		electronApp.quit();
	}, 300));
	
	function closeWatchers() {
		watchers.forEach(w => w.close());
	}
	
	electronApp.on("before-quit", closeWatchers);
}
