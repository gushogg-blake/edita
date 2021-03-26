let _typeof = require("@wildwood/utils/typeof");
let {removeInPlace} = require("../arrayMethods");
let lid = require("../lid");

module.exports = function() {
	let handlers = [];
	let clickedElements = [];
	
	return {
		handle(e) {
			let node = e.target;
			
			while (node) {
				clickedElements.push(node);
				
				node = node.parentNode;
			}
			
			for (let handler of handlers) {
				let {callback, filter} = handler;
				
				if (_typeof(filter) === "Function") {
					filter = filter();
				}
				
				if (_typeof(filter) !== "Array") {
					filter = [filter];
				}
				
				filter = filter.map(el => el && el._id || el);
				
				if (!filter.some(el => clickedElements.includes(el))) {
					callback();
				}
			}
			
			clickedElements = [];
		},
		
		on(callback, filter) {
			let handler = {
				callback,
				filter,
			};
			
			handlers.push(handler);
			
			return function() {
				removeInPlace(handlers, handler);
			}
		},
		
		/*
		add a component/element to the clicked elements
		
		NOTE we use an id for components because they don't have a reference to
		themselves
		*/
		
		add(elOrId) {
			clickedElements.push(elOrId);
		},
		
		id() {
			return lid();
		},
	};
}
