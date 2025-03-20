export function normaliseNewlines(str) {
	let {newline} = platform.systemInfo;
	
	str = str.replaceAll("\r\n", newline)
	str = str.replaceAll("\r", newline);
	str = str.replaceAll("\n", newline);
	
	return str;
}

export function hasMixedNewlines(str) {
	let crlf = false;
	let cr = false;
	let lf = false;
	
	for (let i = 0; i < str.length; i++) {
		let prev = str[i - 1];
		let curr = str[i];
		let next = str[i + 1];
		
		if (curr === "\r" && next === "\n") {
			crlf = true;
			
			if (cr || lf) {
				return true;
			}
		} else if (curr === "\r" && next !== "\n") {
			cr = true;
			
			if (crlf || lf) {
				return true;
			}
		} else if (curr === "\n" && prev !== "\r") {
			lf = true;
			
			if (cr || crlf) {
				return true;
			}
		}
	}
	
	return false;
}

export function getNewline(str) {
	for (let check of ["\r\n", "\r", "\n"]) {
		if (str.includes(check)) {
			return check;
		}
	}
	
	return platform.systemInfo.newline;
}

export function getIndent(code) {
	return detectIndent(code).indent || base.prefs.defaultIndent;
}

/*
There are 3 support levels: general and specific, and alternate.

general means the lang supports the file, and should be used unless there is
a lang with specific support.

specific means the file can be handled by a general lang, but this lang has
more specific support, e.g. Node vs JavaScript.  Languages should only return
"specific" if there is a specific reason to, and specific langs that can also
handle the general lang should return "alternate" for those files.  Node
should return "specific" for .js files that are identifiable as Node files
(e.g. they have a Node hashbang line); alternate for .js files that aren't
identifiable as Node files; and null for anything else.

alternate means the lang supports the file but wouldn't usually be used,
e.g. JavaScript supports JSON files and SCSS supports CSS files.
*/

export function guessLang(code, url) {
	if (url) {
		for (let [langCode, patterns] of Object.entries(base.prefs.fileAssociations)) {
			for (let pattern of patterns) {
				if (platform.fs(url.path).matchName(pattern)) {
					return this.langs.get(langCode);
				}
			}
		}
	}
	
	let general = null;
	let alternate = null;
	let fallback = this.langs.get("plaintext");
	
	for (let lang of this.langs.all.filter(lang => lang !== fallback)) {
		let supportLevel = lang.getSupportLevel(code, url?.path);
		
		if (supportLevel === "specific") {
			return lang;
		} else if (supportLevel === "general" && !general) {
			general = lang;
		} else if (supportLevel === "alternate" && !alternate) {
			alternate = lang;
		}
	}
	
	return general || alternate || fallback;
}
