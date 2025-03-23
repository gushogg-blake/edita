import preprocess from "svelte-preprocess";

export default {
	preprocess: preprocess({
		scss: {
			includePaths: ["src/css"],
		},
	}),
	
	compilerOptions: {
		warningFilter(warning) {
			return !warning.filename?.includes("node_modules") && !warning.code.startsWith("a11y");
		},
	},
};
