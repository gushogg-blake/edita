let {Menu} = require("electron");

module.exports = function(app) {
	return {
		show(e, id, items, coords=null) {
			console.log(id);
			console.log(items);
			let menu = Menu.buildFromTemplate(items.map(function(item) {
				if (!item.id) {
					return item;
				}
				
				return {
					...item,
					
					click() {
						app.callFocusedRenderer("contextMenu", "click", id, item.id);
					},
				};
			}));
			
			let options = {};
			
			if (coords) {
				options = coords;
			}
			
			console.log(options);
			
			menu.popup({
				...options,
				
				callback() {
					app.callFocusedRenderer("contextMenu", "close", id);
				},
			});
		},
	};
}
