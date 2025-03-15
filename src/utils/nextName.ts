export default function(generateName, nameIsAvailable) {
	let i = 0;
	let name;
	
	do {
		name = generateName(++i);
	} while(!nameIsAvailable(name));
	
	return name;
}
