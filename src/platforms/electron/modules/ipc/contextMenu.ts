import ipcRenderer from "platforms/electron/modules/ipcRenderer";
import lid from "utils/lid";
import handleMessages from "./utils/handleMessages";

let clickHandlers = {};

handleMessages("contextMenu", {
	click(e, id, itemId) {
		clickHandlers[id]?.[itemId]();
	},
	
	close(e, id) {
		delete clickHandlers[id];
	},
});

export default function(items, coords=null) {
	let id = lid();
	
	clickHandlers[id] = {};
	
	items = items.map(function(item) {
		return {
			id: item.onClick ? lid() : null,
			...item,
		};
	});
	
	for (let item of items.filter(item => item.onClick)) {
		clickHandlers[id][item.id] = item.onClick;
	}
	
	ipcRenderer.invoke("contextMenu", "show", id, items.map(function(item) {
		return {
			...item,
			onClick: undefined,
		};
	}), coords);
}
