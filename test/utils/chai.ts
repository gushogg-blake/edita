import chai, {assert, expect} from "chai";
import chaiSubset from "chai-subset";

chai.use(chaiSubset);

chai.config.truncateThreshold = 0;

export default chai;

export {assert, expect};
