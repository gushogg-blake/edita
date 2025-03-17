let {ipcRenderer} = require("electron");

/*
allow the main process to call methods on renderers

(otherwise main calling renderers is fire-and-forget)
*/

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
