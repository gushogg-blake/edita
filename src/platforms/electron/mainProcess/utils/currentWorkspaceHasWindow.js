let child_process = require("child_process");

function cmd(c) {
	return child_process.execSync(c).toString();
}

function currentWorkspaceHasWindow() {
	let currentWorkspaceRaw = cmd(`xprop -root _NET_CURRENT_DESKTOP`);
	
	/*
	e.g.
	
	_NET_CURRENT_DESKTOP(CARDINAL) = 0
	*/
	
	let currentWorkspace = currentWorkspaceRaw.replace("_NET_CURRENT_DESKTOP(CARDINAL) = ", "").trim();
	
	let openWindowsRaw = cmd(`wmctrl -lp`);
	
	/*
	e.g.
	
	0x00c00003 -1 1689   mint Bottom Panel
	0x00e00006 -1 1716   mint Desktop
	0x03400004  0 2304   mint Execute and get the output of a shell command in node.js - Stack Overflow - Brave
	0x00e00430  0 1716   mint hogg-blake software ltd
	0x03c00006  0 3255   mint gus@mint ~/Pictures/teeth/resize75
	0x04400003  0 5414   mint currentWorkspaceHasWindow.js (~/projects/edita/src/platforms/electron/mainProcess/utils) - Edita
	0x05200006  0 5658   mint gus@mint ~
	0x05200192  0 5658   mint gus@mint ~/projects/edita
	*/
	
	let lines = openWindowsRaw.trim().split("\n");
	
	for (let line of lines) {
		let [h, ws, pid, host, ...title] = line.split(/\s+/);
		
		title = title.join(" ");
		
		if (title.endsWith(" - Edita") && ws === currentWorkspace) {
			return true;
		}
	}
	
	return false;
}

module.exports = currentWorkspaceHasWindow;
