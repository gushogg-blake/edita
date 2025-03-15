import {app: electronApp} from "electron";
import {spawn} from "child_process";
import path from "path";
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
	
	let watchDialogs = (await buildDir.child("dialogs").ls()).map(function({name}) {
		let watcher = chokidar.watch([
			"dialogs/" + name + ".html",
			"js/dialogs/" + name,
			"css/global.css",
		].map(file => buildDir.child(file).path), watchOptions);
		
		watcher.on("change", function() {
			for (let appWindow of app.appWindows) {
				for (let dialogWindow of Object.values(app.dialogsByAppWindowAndName.get(appWindow))) {
					dialogWindow.reload();
				}
			}
		});
		
		return watcher;
	});
	
	let watchMain = chokidar.watch(__dirname, watchOptions);
	
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
		[watchMain, watchRenderer, ...watchDialogs].forEach(w => w.close());
	}
	
	electronApp.on("before-quit", closeWatchers);
}
