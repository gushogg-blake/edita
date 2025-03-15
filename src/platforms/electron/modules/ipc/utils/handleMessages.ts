let ipcRenderer = require("platform/modules/ipcRenderer");

module.exports = function(channel, handler) {
	return ipcRenderer.handle(channel, function(e, method, ...args) {
		return handler[method](e, ...args);
	});
}
