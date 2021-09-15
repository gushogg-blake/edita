let {ipcMain} = require("electron");
let lid = require("../../../../utils/lid");

module.exports = {
	on(...args) {
		return ipcMain.on(...args);
	},
	
	off(...args) {
		return ipcMain.off(...args);
	},
	
	handle(...args) {
		return ipcMain.handle(...args);
	},
	
	callRenderer(browserWindow, channel, ...args) {
		return new Promise(function(resolve) {
			let responseChannel = lid();
			
			function teardown() {
				ipcMain.off(responseChannel, handler);
			}
			
			function handler(e, result) {
				teardown();
				
				resolve(result);
			}
			
			ipcMain.on(responseChannel, handler);
			
			browserWindow.webContents.send(channel, {
				responseChannel,
				args,
			});
		});
	},
};
