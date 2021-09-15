let {ipcMain} = require("electron");
let lid = require("../../../../utils/lid");

let ipc = Object.create(ipcMain);

Object.assign(ipc, {
	sendToRenderer(browserWindow, ...args) {
		browserWindow.webContents.send(...args);
	},
	
	callRenderer(browserWindow, channel, ...args) {
		return new Promise(function(resolve) {
			let responseChannel = lid();
			
			function teardown() {
				ipc.off(responseChannel, handler);
			}
			
			function handler(e, result) {
				teardown();
				
				resolve(result);
			}
			
			ipc.on(responseChannel, handler);
			
			browserWindow.webContents.send(channel, {
				responseChannel,
				args,
			});
		});
	},
});

module.exports = ipc;
