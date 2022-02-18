require("dotenv").config();

let {notarize} = require("electron-notarize");

/*
Enable notarization:

add "afterSign": "scripts/notarize.js" at the end of electron-builder.json
*/

let {
	APPLEID,
	APPLEIDPASS,
	ASCPROVIDER,
} = process.env;

exports.default = async function(context) {
	let {electronPlatformName, appOutDir} = context;
	
	if (electronPlatformName !== "darwin") {
		return;
	}

	let appName = context.packager.appInfo.productFilename;

	return await notarize({
		appBundleId: "com.treefrog-editor.app",
		appPath: `${appOutDir}/${appName}.app`,
		appleId: APPLEID,
		appleIdPassword: APPLEIDPASS,
		ascProvider: ASCPROVIDER,
	});
}
