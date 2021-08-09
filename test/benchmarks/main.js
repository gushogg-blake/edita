let TreeSitter = require("tree-sitter");
let App = require("../../src/modules/App");
let Platform = require("../platform/Platform");
let Base = require("../platform/Base");

global.TreeSitter = TreeSitter;

global.platform = new Platform();
global.base = new Base();
