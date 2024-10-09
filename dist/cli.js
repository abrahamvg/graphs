#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require("./");
require("dotenv/config");
const cli = async () => {
    return (0, _1.generateGraphs)();
};
cli();
//# sourceMappingURL=cli.js.map