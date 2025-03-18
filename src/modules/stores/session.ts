import JsonStore from "modules/stores/JsonStore";

let migrations = {
	"1"(session) {
		if (session) {
			for (let details of session.tabs) {
				if (!details.folds) {
					details.folds = {};
				}
			}
		} else {
			return session;
		}
	},
	
	"2"(session) {
		if (!session) {
			return session;
		}
		
		function encodePathParts(url) {
			if (!url.startsWith("file://")) {
				return url;
			}
			
			let path = url.substr("file://".length);
			let encoded = "/" + path.split("/").slice(1).map(p => encodeURIComponent(p)).join("/");
			
			return "file://" + encoded;
		}
		
		if (session.selectedTabUrl) {
			session.selectedTabUrl = encodePathParts(session.selectedTabUrl);
		}
		
		if (session.tabs) {
			session.tabs = session.tabs.map(function(tab) {
				return {...tab, url: encodePathParts(tab.url)};
			});
		}
	},
};

export default function() {
	let defaultSession = null;
	
	return new JsonStore("session", defaultSession, migrations);
}
