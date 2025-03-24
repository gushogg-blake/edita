import {type Selection, s} from "core/Selection";
import cachedNodeFunction from "./utils/cachedNodeFunction";
import {treeSitterPointToCursor} from "./conversions";

let api = {
	type: cachedNodeFunction(node => node.type),
	text: cachedNodeFunction(node => node.text),
	startPosition: cachedNodeFunction(node => node.startPosition),
	endPosition: cachedNodeFunction(node => node.endPosition),
	parent: cachedNodeFunction(node => node.parent),
	childCount: cachedNodeFunction(node => node.childCount),
	children: cachedNodeFunction(node => node.children),
	
	// NOTE tree-sitter has a bug where zero-length nodes don't have
	// the right parent, so we skip them for traversal
	
	firstChild: cachedNodeFunction(function(node) {
		for (let child of api.children(node)) {
			if (api.text(child).length > 0) {
				return child;
			}
		}
		
		return null;
	}),
	
	lastChild: cachedNodeFunction(function(node) {
		let children = api.children(node);
		
		for (let i = children.length - 1; i >= 0; i--) {
			let child = children[i];
			
			if (api.text(child).length > 0) {
				return child;
			}
		}
		
		return null;
	}),
	
	nextSibling: cachedNodeFunction(function(node) {
		let parent = api.parent(node);
		
		if (!parent) {
			return null;
		}
		
		let foundNode = false;
		
		for (let child of api.children(parent)) {
			if (foundNode && api.text(child).length > 0) {
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
		
		let lastSibling = null;
		
		for (let child of api.children(parent)) {
			if (child.id === node.id) {
				return lastSibling;
			}
			
			if (api.text(child).length > 0) {
				lastSibling = child;
			}
		}
		
		return null;
	}),
	
	next: cachedNodeFunction(function(node) {
		let firstChild = api.firstChild(node);
		
		if (firstChild) {
			return firstChild;
		}
		
		let nextSibling = api.nextSibling(node);
		
		if (nextSibling) {
			return nextSibling;
		}
		
		while (node = api.parent(node)) {
			let nextSibling = api.nextSibling(node);
			
			if (nextSibling) {
				return nextSibling;
			}
		}
		
		return null;
	}),
	
	lineage: function(node) {
		let lineage = [node];
		let parent = api.parent(node);
		
		while (parent) {
			lineage.unshift(parent);
			
			parent = api.parent(parent);
		}
		
		return lineage;
	},
	
	selection(node) {
		let {startPosition, endPosition} = api.get(node, "startPosition", "endPosition");
		
		return s(treeSitterPointToCursor(startPosition), treeSitterPointToCursor(endPosition));
	},
	
	get(node, ...fields) {
		let result = {};
		
		for (let field of fields) {
			result[field] = api[field](node);
		}
		
		return result;
	},
};

export default api;
