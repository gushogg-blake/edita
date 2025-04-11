export class IndentationDetails {
	type: "tab" | "space";
	string: string;
	re: RegExp;
	colsPerIndent: number;
	
	constructor(indent: string) {
		let type = indent[0] === "\t" ? "tab" : "space";
		
		// TODO enable overriding tabWidth in project settings
		let {tabWidth} = base.prefs;
		
		this.type = type;
		this.string = indent;
		this.re = new RegExp("^(" + indent + ")*");
		this.colsPerIndent = type === "tab" ? indent.length * tabWidth : indent.length;
	}
}

export default class Format {
	newline: "\r\n" | "\r" | "\n";
	indentation: IndentationDetails;
	lang: Lang;
	
	constructor(newline, indent, lang) {
		this.newline = newline;
		this.indentation = new IndentationDetails(indent);
		this.lang = lang;
	}
}
