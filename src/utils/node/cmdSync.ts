import child_process from "child_process";

function cmd(c) {
	return child_process.execSync(c).toString();
}

export default cmd;
