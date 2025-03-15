export default function(document) {
	return {
		wrap: base.getPref("wrap") || base.getPref("defaultWrapLangs").includes(document.lang.code),
	};
}
