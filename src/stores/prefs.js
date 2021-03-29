import LocalStorage from "../modules/stores/LocalStorage";

export default new LocalStorage("prefs", {
	font: "14px DejaVu Sans Mono",
	indentWidth: 4,
	lineNumberColor: "#9f9f9f",
	marginBackground: "#f0f0f0",
	
	langs: {
		js: {
			colors: {
				keyword: "#aa33aa",
				id:  "#202020",
				comment: "#7f7f7f",
				symbol: "#bb22bb",
				number: "#cc2222",
				string: "#2233bb",
				regex: "#cc7030",
			},
		},
	},
});
