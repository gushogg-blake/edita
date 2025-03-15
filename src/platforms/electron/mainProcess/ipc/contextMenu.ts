let {Menu} = require("electron");

export default function(app) {
	return {
		show(e, id, items, coords=null) {
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
			
			menu.popup({
				...options,
				
				callback() {
					app.callFocusedRenderer("contextMenu", "close", id);
				},
			});
		},
	};
}
