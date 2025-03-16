import {app as electronApp} from "electron";
import {spawn} from "node:child_process";
import path from "node:path";
import chokidar from "chokidar";

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
	
	let watchRenderer = chokidar.watch([
		"js/main.js",
		"css/global.css",
	].map(path => buildDir.child(path).path), watchOptions);
	
	watchRenderer.on("change", function() {
		app.appWindows.forEach(browserWindow => browserWindow.reload());
	});
	
	let watchMain = chokidar.watch(buildDir.child("mainProcess").path, watchOptions);
	
	setTimeout(function() {
		watchMain.on("change", debounce(function() {
			let child = spawn("npm", ["run", "electron"], {
				detached: true,
				stdio: "inherit",
			});
			
			child.unref();
			
			closeWatchers();
			
			app.forceQuit();
		}, 300));
	}, 8000);
	
	function closeWatchers() {
		[watchMain, watchRenderer].forEach(w => w.close());
	}
	
	electronApp.on("before-quit", closeWatchers);
}
