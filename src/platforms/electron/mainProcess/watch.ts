import {app as electronApp} from "electron";
import {spawn} from "node:child_process";
import path from "node:path";
import chokidar from "chokidar";
import {fs} from "utils/node";

function debounce(fn, delay) {
	let timer;
	
	return function(...args) {
		clearTimeout(timer);
		
		timer = setTimeout(() => fn(...args), delay);
	}
}

let watchOptions = {
	ignoreInitial: true,
};

export default async function(app) {
	let {buildDir} = app;
	let mainProcessDir = buildDir.child("mainProcess");
	
	let watchRenderer = chokidar.watch(buildDir.path, {
		...watchOptions,
		
		ignored(path) {
			return fs(path).isDescendantOf(mainProcessDir);
		},
	});
	
	watchRenderer.on("change", function() {
		app.windows.forEach(browserWindow => browserWindow.reload());
	});
	
	let watchMain = chokidar.watch(mainProcessDir.path, watchOptions);
	
	watchMain.on("change", debounce(function(path) {
		let child = spawn("npm", ["run", "restart"], {
			detached: true,
			stdio: "inherit",
		});
		
		child.unref();
		
		closeWatchers();
		
		app.forceQuit();
	}, 300));
	
	function closeWatchers() {
		[watchMain, watchRenderer].forEach(w => w.close());
	}
	
	electronApp.on("before-quit", closeWatchers);
}
