export function splice(array, ...args) {
	return module.exports.spliceInPlace(array.slice(), ...args);
}

export function push(array, ...elements) {
	return [...array, ...elements];
}

export function add(array, ...elements) {
	return [...array, ...elements.filter(e => !array.includes(e))];
}

export function pop(array) {
	return array.slice(0, array.length - 1);
}

export function shift(array) {
	return array.slice(1);
}

export function unshift(array, ...elements) {
	return [...elements, ...array];
}

export function remove(array, item) {
	return array.filter(_item => _item !== item);
}

export function move(array, item, newIndex) {
	return moveInPlace([...array], item, newIndex);
}

export function sort(array, comparator) {
	return array.slice().sort(comparator);
}

export function reverse(array, comparator) {
	return array.slice().reverse();
}

export function spliceInPlace(array, i, deleteElements, ...insertElements) {
	array.splice(i, deleteElements, ...insertElements);
	
	return array;
}

export function pushInPlace(array, ...elements) {
	array.push(...elements);
	
	return array;
}

export function addInPlace(array, ...elements) {
	for (let e of elements) {
		if (!array.includes(e)) {
			array.push(e);
		}
	}
}

export function popInPlace(array) {
	array.pop();
	
	return array;
}

export function shiftInPlace(array) {
	array.shift();
	
	return array;
}

export function unshiftInPlace(array, elements) {
	array.unshift(elements);
	
	return array;
}

export function removeInPlace(array, item) {
	let index;
	
	while ((index = array.indexOf(item)) !== -1) {
		array.splice(index, 1);
	}
	
	return array;
}

export function moveInPlace(array, item, newIndex) {
	let oldIndex = array.indexOf(item);
	
	if (oldIndex === -1 || oldIndex === newIndex) {
		return array;
	}
	
	array.splice(oldIndex, 1);
	
	if (oldIndex < newIndex) {
		newIndex--;
	}
	
	array.splice(newIndex, 0, item);
	
	return array;
}

export function sortInPlace(array, comparator) {
	array.sort(comparator);
	
	return array;
}

export function reverseInPlace(array) {
	array.reverse();
	
	return array;
}

