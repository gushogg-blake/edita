export default function(startIndex, endIndex) {
	return startIndex + Math.floor((endIndex - 1 - startIndex) / 2);
}
