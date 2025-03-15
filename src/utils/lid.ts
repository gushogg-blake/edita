/*
Generate locally unique ids
*/

let id = Date.now();

export default function() {
	return (++id).toString(36);
}
