function *generateRequiredLangs(lang, seen=[]) {
	if (seen.includes(lang)) {
		return;
	}
	
	yield lang;
	
	seen.push(lang);
	
	for (let code of lang.possibleInjections || []) {
		yield* generateRequiredLangs(base.langs.get(code), seen);
	}
}

module.exports = generateRequiredLangs;
