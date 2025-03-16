import ipcRenderer from "platforms/electron/modules/ipcRenderer";

export default function(channel, handler) {
	return ipcRenderer.on(channel, function(e, method, ...args) {
		return handler[method](e, ...args);
	});
}
