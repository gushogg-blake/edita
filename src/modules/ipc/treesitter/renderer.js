let {ipcRenderer} = window.require("electron");

module.exports = {
	parse(code, lang) {
		return ipcRenderer.sendSync("treesitter/parse", code, lang);
	},
};
