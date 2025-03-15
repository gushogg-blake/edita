export default function(code) {
	try {
		return new Function("util", "context", `
			with (util) {
				with (context) {
					return ${code};
				}
			}
		`);
	} catch (e) {
		console.log(e);
		
		return new Function(`return "";`);
	}
}
