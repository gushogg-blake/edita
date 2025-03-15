export default function*(array) {
	for (let item of array) {
		yield item;
	}
}
