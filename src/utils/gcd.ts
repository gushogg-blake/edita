function _gcd(a, b) {
	if (b === 0) {
		return a;
	} else {
		return gcd(b, a % b);
	}
}

function gcd(n, ...rest) {
	if (rest.length === 0) {
		return n;
	} else {
		return _gcd(n, gcd(...rest));
	}
}

export default gcd;
