let {Menu} = require("electron");

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
						app.callFocusedRenderer("contextMenu/click", [id, item.id]);
					},
				};
			}));
			
			menu.popup({
				callback() {
					app.callFocusedRenderer("contextMenu/close", [id]);
				},
			});
		},
	};
}
