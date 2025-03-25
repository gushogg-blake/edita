import * as chai from "chai";
import chaiSubset from "chai-subset";
import Platform from "platforms/web/Platform";
import {setGlobals} from "platforms/common/globals";

chai.use(chaiSubset);

chai.config.truncateThreshold = 0;

setGlobals(Platform);

export default async function() {
	await platform.init({
		test: true,
	});
	
	await base.init({});
	
	await Promise.all(["javascript", "html", "css", "php"].map(code => base.initLang(base.langs.get(code))));
}
