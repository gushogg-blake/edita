#!/usr/bin/env node

let fs = require("fs");

let template = fs.readFileSync(process.stdin.fd).toString();
let replaced = template.replace(/%(\w+)%/g, (_, name) => process.env[name]);

process.stdout.write(replaced);
