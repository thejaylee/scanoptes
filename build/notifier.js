"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notify = void 0;
const notifier = require('node-notifier');
function notify(...args) {
    notifier.notify(...args);
}
exports.notify = notify;
