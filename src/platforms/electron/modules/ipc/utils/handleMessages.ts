let ipcRenderer = require("platforms/electron/modules/ipcRenderer");

module.exports = function(channel, handler) {
	return ipcRenderer.handle(channel, function(e, method, ...args) {
		return handler[method](e, ...args);
	});
}
