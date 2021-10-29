let cachedNodeFunction = require("./cachedNodeFunction");

let api = {
	type: cachedNodeFunction(node => node.type),
	text: cachedNodeFunction(node => node.text),
	startPosition: cachedNodeFunction(node => node.startPosition),
	endPosition: cachedNodeFunction(node => node.endPosition),
	parent: cachedNodeFunction(node => node.parent),
	childCount: cachedNodeFunction(node => node.childCount),
	children: cachedNodeFunction(node => node.children),
	
	firstChild: cachedNodeFunction(function(node) {
		for (let child of api.children(node)) {
			if (child.text.length > 0) {
				return child;
			}
		}
		
		return null;
	}),
	
	lastChild: cachedNodeFunction(function(node) {
		let {children} = node;
		
		for (let i = children.length - 1; i >= 0; i--) {
			let child = children[i];
			
			if (child.text.length > 0) {
				return child;
			}
		}
		
		return null;
	}),
	
	nextSibling: cachedNodeFunction(function(node) {
		let {parent} = node;
		
		if (!parent) {
			return null;
		}
		
		let foundNode = false;
		
		for (let child of api.children(parent)) {
			if (foundNode && child.text.length > 0) {
				return child;
			}
			
			if (child.id === node.id) {
				foundNode = true;
			}
		}
		
		return null;
	}),
	
	previousSibling: cachedNodeFunction(function(node) {
		let parent = api.parent(node);
		
		if (!parent) {
			return null;
		}
		
		let foundNode = false;
		
		let children = api.children(parent);
		
		for (let i = children.length - 1; i >= 0; i--) {
			let child = children[i];
			
			if (foundNode && child.text.length > 0) {
				return child;
			}
			
			if (child.id === node.id) {
				foundNode = true;
			}
		}
		
		return null;
	}),
	
	get(node, ...fields) {
		let result = {};
		
		for (let field of fields) {
			result[field] = api[field](node);
		}
		
		return result;
	},
};

module.exports = api;
