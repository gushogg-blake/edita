let lines = [];

for (let i = 0; i < 30000; i++) {
	lines.push({
		displayLines: "d".repeat(Math.round(Math.random() * 5)).split("").map(c => ({})),
		//height: Math.round(Math.random() * 5)
	});
}

let scrollPosition = 15000;

function findLine() {
	let n = 0;
	
	for (let line of lines) {
		if (n >= scrollPosition) {
			return n;
		}
		
		n += line.displayLines.length;
		//n += line.height;
	}
}

console.time("time");
findLine();
findLine();
findLine();
findLine();
findLine();
console.timeEnd("time");
