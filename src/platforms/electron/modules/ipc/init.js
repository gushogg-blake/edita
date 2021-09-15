let {ipcRenderer} = require("electron");

module.exports = ipcRenderer.sendSync("init", "init");
