import dotenv from "dotenv";

let {NODE_ENV} = process.env;

let files = {
	production: ".env",
	default: ".env.development",
};

export default {
	config() {
		dotenv.config({
			path: files[NODE_ENV] || files.default,
		});
	},
};
