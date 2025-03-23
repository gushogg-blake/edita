import * as chai from "chai";
import chaiSubset from "chai-subset";

let {assert, expect} = chai;

chai.use(chaiSubset);

chai.config.truncateThreshold = 0;

export default chai;

export {assert, expect};
