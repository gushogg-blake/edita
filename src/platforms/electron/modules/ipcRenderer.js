let {ipcRenderer} = require("electron");

module.exports = {
	invoke(...args) {
		return ipcRenderer.invoke(...args);
	},
	
	handle(channel, handler) {
		let listener = async function(e, data) {
			let {responseChannel, args} = data;
			
			ipcRenderer.send(responseChannel, await handler(e, ...args));
		}
		
		ipcRenderer.on(channel, listener);
		
		return function() {
			ipcRenderer.off(channel, listener);
		}
	},
};
