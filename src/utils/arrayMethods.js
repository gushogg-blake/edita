module.exports = {
	splice(array, ...args) {
		return module.exports.spliceInPlace(array.slice(), ...args);
	},
	
	push(array, ...elements) {
		return [...array, ...elements];
	},
	
	add(array, ...elements) {
		return [...array, ...elements.filter(e => !array.includes(e))];
	},
	
	pop(array) {
		return array.slice(0, array.length - 1);
	},
	
	shift(array) {
		return array.slice(1);
	},
	
	unshift(array, ...elements) {
		return [...elements, ...array];
	},
	
	remove(array, item) {
		return array.filter(_item => _item !== item);
	},
	
	sort(array, comparator) {
		return array.slice().sort(comparator);
	},
	
	reverse(array, comparator) {
		return array.slice().reverse();
	},
	
	spliceInPlace(array, i, deleteElements, ...insertElements) {
		array.splice(i, deleteElements, ...insertElements);
		
		return array;
	},
	
	pushInPlace(array, ...elements) {
		array.push(...elements);
		
		return array;
	},
	
	addInPlace(array, ...elements) {
		for (let e of elements) {
			if (!array.includes(e)) {
				array.push(e);
			}
		}
	},
	
	popInPlace(array) {
		array.pop();
		
		return array;
	},
	
	shiftInPlace(array) {
		array.shift();
		
		return array;
	},
	
	unshiftInPlace(array, elements) {
		array.unshift(elements);
		
		return array;
	},
	
	removeInPlace(array, item) {
		let index;
		
		while ((index = array.indexOf(item)) !== -1) {
			array.splice(index, 1);
		}
		
		return array;
	},
	
	sortInPlace(array, comparator) {
		array.sort(comparator);
		
		return array;
	},
	
	reverseInPlace(array) {
		array.reverse();
		
		return array;
	},
};
