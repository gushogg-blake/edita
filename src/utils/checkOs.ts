export default function() {
	let {appVersion} = navigator;
	
	if (appVersion.includes("Linux")) {
		return "linux";
	} else if (appVersion.includes("Win")) {
		return "windows";
	} else if (appVersion.includes("Mac")) {
		return "mac";
	}
}
