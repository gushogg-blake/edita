export function normaliseNewlines(str) {
	let {newline} = platform.systemInfo;
	
	str = str.replaceAll("\r\n", newline)
	str = str.replaceAll("\r", newline);
	str = str.replaceAll("\n", newline);
	
	return str;
}

export function checkNewlines(str) {
	let mixed = false;
	let mostCommon = null;
	let all = str.match(/(\r\n|\r|\n)/g);
	
	if (!all) {
		return {
			mixed,
			mostCommon,
		};
	}
	
	let crlf = 0;
	let cr = 0;
	let lf = 0;
	
	for (let sequence of all) {
		if (sequence === "\r\n") {
			crlf++;
		} else if (sequence === "\r") {
			cr++;
		} else {
			lf++;
		}
	}
	
	if (crlf + cr + lf === 0) {
		return {
			mixed,
			mostCommon,
		};
	}
	
	mixed = [crlf, cr, lf].filter(c => c > 0).length > 1;
	
	if (crlf > cr && crlf > lf) {
		mostCommon = "\r\n";
	} else if (cr > crlf && cr > lf) {
		mostCommon = "\r";
	} else if (lf > crlf && lf > cr) {
		mostCommon = "\n";
	}
	
	if (mostCommon) {
		return {
			mixed,
			mostCommon,
		};
	}
	
	return {
		mixed,
		mostCommon: "\n",
	};
}

export function getIndentationDetails(indent, tabWidth=4) {
	let type = indent[0] === "\t" ? "tab" : "space";
	
	return {
		type,
		string: indent,
		re: new RegExp("^(" + indent + ")*"),
		colsPerIndent: type === "tab" ? indent.length * tabWidth : indent.length,
	};
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
