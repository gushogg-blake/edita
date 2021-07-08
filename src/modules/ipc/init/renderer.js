let {ipcRenderer} = window.require("electron");

module.exports = ipcRenderer.sendSync("init/init");
