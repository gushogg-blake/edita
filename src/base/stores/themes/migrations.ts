import defaultThemes from "./defaultThemes";

export default {
	"18"(theme, key) {
		return defaultThemes[key] || undefined;
	},
};
