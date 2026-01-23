"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var ReactDOM = require("react-dom/client");
var react_router_dom_1 = require("react-router-dom");
var Routing_1 = require("./app/Routing");
// Global error logging
var logError = function (data) {
    fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(__assign(__assign({}, data), { url: location.href, timestamp: new Date().toISOString() })),
    }).catch(function () { });
};
window.addEventListener('error', function (e) {
    var stack = 'stack' in e.error ? e.error.stack : undefined;
    logError({ type: 'error', message: e.message, stack: stack });
});
window.addEventListener('unhandledrejection', function (e) {
    logError({ type: 'unhandledrejection', message: String(e.reason) });
});
var _root = ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode>
    <react_router_dom_1.BrowserRouter>
      <Routing_1.default />
    </react_router_dom_1.BrowserRouter>
  </React.StrictMode>);
