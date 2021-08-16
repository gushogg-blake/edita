let {ipcRenderer: ipc} = window.require("electron-better-ipc");
let lid = require("utils/lid");

let clickHandlers = {};

ipc.answerMain("contextMenu/click", function([id, itemId]) {
	clickHandlers[id][itemId]();
});

ipc.answerMain("contextMenu/close", function([id]) {
	delete clickHandlers[id];
});

module.exports = function(items) {
	let id = lid();
	
	clickHandlers[id] = {};
	
	for (let item of items.filter(item => item.onClick)) {
		clickHandlers[id][item.id] = item.onClick;
	}
	
	ipc.callMain("contextMenu/show", [id, items.map(function(item) {
		return {
			...item,
			onClick: undefined,
		};
	})]);
}
