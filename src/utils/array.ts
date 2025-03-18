import _typeof from "utils/typeof";

export function groupBy(array, field, _default=null) {
	let obj = {};
		
	for (let item of array) {
		let key = _typeof(field) === "Function" ? field(item) : item[field];
		
		key = key || _default;
		
		if (!key) {
			continue;
		}
		
		if (!obj[key]) {
			obj[key] = [];
		}
		
		obj[key].push(item);
	}
	
	return obj;
}

export function unique(array) {
	let result = [];
	
	for (let item of array) {
		if (!result.includes(item)) {
			result.push(item);
		}
	}
	
	return result;
}

/*
split an array at the point that the condition stops being true
*/

export function sortedPartition(array, fn) {
	let index = array.length;
	
	for (let i = 0; i < array.length; i++) {
		if (!fn(array[i])) {
			index = i;
			
			break;
		}
	}
	
	return [array.slice(0, index), array.slice(index)];
}

export function partition(array, fn) {
	let _true = [];
	let _false = [];
	
	for (let item of array) {
		if (fn(item)) {
			_true.push(item);
		} else {
			_false.push(item);
		}
	}
	
	return [_true, _false];
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
