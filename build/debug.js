"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debug = void 0;
const NODE_ENV = process.env.NODE_ENV;
if (NODE_ENV == 'debug') {
    exports.debug = console.log;
}
else {
    exports.debug = () => { };
}
