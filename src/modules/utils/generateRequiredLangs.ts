function *generateRequiredLangs(lang, seen=[]) {
	if (seen.includes(lang)) {
		return;
	}
	
	yield lang;
	
	seen.push(lang);
	
	for (let code of lang.possibleInjections || []) {
		let lang = base.langs.get(code);
		
		if (lang) {
			yield* generateRequiredLangs(lang, seen);
		}
	}
}

module.exports = generateRequiredLangs;
