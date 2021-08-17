let {Menu} = require("electron");
let {ipcMain: ipc} = require("electron-better-ipc");

module.exports = function(app) {
	return {
		show(id, items) {
			let menu = Menu.buildFromTemplate(items.map(function(item) {
				if (!item.id) {
					return item;
				}
				
				return {
					...item,
					
					click() {
						ipc.callFocusedRenderer("contextMenu/click", [id, item.id]);
					},
				};
			}));
			
			menu.popup({
				callback() {
					ipc.callFocusedRenderer("contextMenu/close", [id]);
				},
			});
		},
	};
}
