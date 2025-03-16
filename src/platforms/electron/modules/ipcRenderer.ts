let {ipcRenderer} = require("electron");

let ipc = Object.create(ipcRenderer);

Object.assign(ipc, {
	handle(channel, handler) {
		let listener = async function(e, data) {
			let {responseChannel, args} = data;
			
			ipc.send(responseChannel, await handler(e, ...args));
		}
		
		ipc.on(channel, listener);
		
		return function() {
			ipc.off(channel, listener);
		}
	},
});

export default ipc;
