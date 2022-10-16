let {is, deep, subset} = require("test/utils/assertions");
let dedent = require("test/utils/dedent");
let URL = require("modules/URL");
let Document = require("modules/Document");
let View = require("modules/View");
let Renderer = require("modules/View/renderCodeAndMargin/Renderer");
let CodeRenderer = require("modules/View/renderCodeAndMargin/CodeRenderer");

function init(lang, code) {
	let document = new Document(dedent(code), URL._new("a." + lang));
	let view = new View(document);
	let string = "";
	
	let renderer = new Renderer(view, {
		createCodeRenderer() {
			return {
				setColor() {},
				startRow() {},
				
				drawText(str) {
					string += str;
				},
				
				drawTab() {
					string += "\t";
				},
				
				endRow() {
					string += "\n";
				},
			};
		},
	});
	
	return {
		document,
		view,
		renderer,
		getString: () => string,
	};
}

function state(codeRenderer, props) {
	subset(codeRenderer, props);
}

describe("CodeRenderer", function() {
	it("stepping", function() {
		let {document, view, renderer, getString} = init("html", `
			<div></div>
		`);
		
		let [{scope, ranges}] = renderer.getVisibleScopes();
		
		let codeRenderer = new CodeRenderer(renderer, scope, ranges);
		
		is(codeRenderer.cursor.lineIndex, 0);
		
		codeRenderer.step();
		
		let string = getString();
		console.log(string + "|" + document.string.substr(string.length));
		console.log(codeRenderer.node?.type);
		console.log(codeRenderer.cursor.lineIndex + ", " + codeRenderer.cursor.offset);
		
		codeRenderer.step();
	});
});
