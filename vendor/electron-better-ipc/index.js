if (process.type === "renderer") {
	module.exports.ipcRenderer = require("./renderer.js");
} else {
	module.exports.ipcMain = require("./main.js");
}
