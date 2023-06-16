"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nextNonce = exports.random = exports.sleep = void 0;
const snowyflake_1 = require("snowyflake");
const sleep = async (ms) => await new Promise((resolve) => setTimeout(resolve, ms));
exports.sleep = sleep;
const random = (min, max) => Math.floor(Math.random() * (max - min) + min);
exports.random = random;
// const snowflake = new Snowflake(1);
const snowflake = new snowyflake_1.Snowyflake({
    workerId: 0n,
    processId: 0n,
    epoch: snowyflake_1.Epoch.Discord, // BigInt timestamp
});
const nextNonce = () => snowflake.nextId().toString();
exports.nextNonce = nextNonce;
//# sourceMappingURL=index.js.map