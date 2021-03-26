"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var types_1 = require("./types");
var static_1 = require("./static");
var errInvalidDefaults = 'Invalid "defaults" parameter: ';
var ConnectionString = /** @class */ (function () {
    function ConnectionString(cs, defaults) {
        var _this = this;
        if (typeof cs !== 'string') {
            throw new TypeError('Invalid connection string: ' + JSON.stringify(cs));
        }
        if (defaults !== undefined && defaults !== null && typeof defaults !== 'object') {
            throw new TypeError(errInvalidDefaults + JSON.stringify(defaults));
        }
        cs = cs.trim();
        static_1.validateUrl(cs); // will throw, if failed
        // Extracting the protocol:
        var m = cs.match(/^[\w-_.+!*'()$%:]*:\/\//);
        if (m) {
            var protocol = m[0].replace(/:\/\//, '');
            if (protocol) {
                this.protocol = static_1.decode(protocol);
            }
            cs = cs.substr(m[0].length);
        }
        // Extracting user + password:
        m = cs.match(/^([\w-_.+!*'()$%]*):?([\w-_.+!*'()$%]*)@/);
        if (m) {
            if (m[1]) {
                this.user = static_1.decode(m[1]);
            }
            if (m[2]) {
                this.password = static_1.decode(m[2]);
            }
            cs = cs.substr(m[0].length);
        }
        // Extracting hosts details:
        // (if it starts with `/`, it is the first path segment, no hosts specified)
        if (cs[0] !== '/') {
            var endOfHosts = cs.search(/\/|\?/);
            var hosts = (endOfHosts === -1 ? cs : cs.substr(0, endOfHosts)).split(',');
            hosts.forEach(function (h) {
                var host = static_1.parseHost(h);
                if (host) {
                    if (!_this.hosts) {
                        _this.hosts = [];
                    }
                    _this.hosts.push(host);
                }
            });
            if (endOfHosts >= 0) {
                cs = cs.substr(endOfHosts);
            }
        }
        // Extracting the path:
        m = cs.match(/\/([\w-_.+!*'()$%]+)/g);
        if (m) {
            this.path = m.map(function (s) { return static_1.decode(s.substr(1)); });
        }
        // Extracting parameters:
        var idx = cs.indexOf('?');
        if (idx !== -1) {
            cs = cs.substr(idx + 1);
            m = cs.match(/([\w-_.+!*'()$%]+)=([\w-_.+!*'()$%]+)/g);
            if (m) {
                var params_1 = {};
                m.forEach(function (s) {
                    var a = s.split('=');
                    var prop = static_1.decode(a[0]);
                    if (prop in params_1) {
                        throw new Error('Parameter "' + prop + '" is repeated.');
                    }
                    params_1[prop] = static_1.decode(a[1]);
                });
                this.params = params_1;
            }
        }
        if (defaults) {
            this.setDefaults(defaults);
        }
    }
    Object.defineProperty(ConnectionString.prototype, "hostname", {
        /**
         * Safe accessor to the first host's name.
         */
        get: function () {
            return this.hosts && this.hosts[0].name;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ConnectionString.prototype, "port", {
        /**
         * Safe accessor to the first host's port.
         */
        get: function () {
            return this.hosts && this.hosts[0].port;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Parses a host name into an object, which then can be passed into `setDefaults`.
     *
     * It returns `null` only when no valid host recognized.
     */
    ConnectionString.parseHost = function (host) {
        return static_1.parseHost(host, true);
    };
    /**
     * Converts into a string.
     */
    ConnectionString.prototype.toString = function (options) {
        var s = '';
        var opts = options || {};
        if (this.protocol) {
            s += static_1.encode(this.protocol, opts).replace(/%3A/g, ':') + '://';
        }
        if (this.user || this.password) {
            if (this.user) {
                s += static_1.encode(this.user, opts);
            }
            if (this.password) {
                s += ':';
                var h = opts.passwordHash;
                if (h) {
                    var code = (typeof h === 'string' && h[0]) || '#';
                    s += new Array(this.password.length + 1).join(code);
                }
                else {
                    s += static_1.encode(this.password, opts);
                }
            }
            s += '@';
        }
        if (Array.isArray(this.hosts)) {
            s += this.hosts.map(function (h) { return static_1.fullHostName(h, options); }).join();
        }
        if (Array.isArray(this.path)) {
            this.path.forEach(function (seg) {
                s += '/' + static_1.encode(seg, opts);
            });
        }
        if (this.params && typeof this.params === 'object') {
            var params = [];
            for (var a in this.params) {
                var value = this.params[a];
                if (typeof value !== 'string') {
                    value = JSON.stringify(value);
                }
                value = static_1.encode(value, opts);
                if (opts.plusForSpace) {
                    value = value.replace(/%20/g, '+');
                }
                params.push(static_1.encode(a, opts) + '=' + value);
            }
            if (params.length) {
                s += '?' + params.join('&');
            }
        }
        return s;
    };
    /**
     * Applies default parameters.
     */
    ConnectionString.prototype.setDefaults = function (defaults) {
        if (!defaults || typeof defaults !== 'object') {
            throw new TypeError(errInvalidDefaults + JSON.stringify(defaults));
        }
        if (!('protocol' in this) && static_1.hasText(defaults.protocol)) {
            this.protocol = defaults.protocol && defaults.protocol.trim();
        }
        // Missing default hosts are merged with the existing ones:
        if (Array.isArray(defaults.hosts)) {
            var hosts_1 = Array.isArray(this.hosts) ? this.hosts : [];
            var dhHosts = defaults.hosts.filter(function (d) { return d && typeof d === 'object'; });
            dhHosts.forEach(function (dh) {
                var dhName = dh.name && static_1.hasText(dh.name) ? dh.name.trim() : undefined;
                var h = { name: dhName, port: dh.port, type: dh.type };
                var found = false;
                for (var i = 0; i < hosts_1.length; i++) {
                    var thisHost = static_1.fullHostName(hosts_1[i]), defHost = static_1.fullHostName(h);
                    if (thisHost.toLowerCase() === defHost.toLowerCase()) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    var obj_1 = {};
                    if (h.name) {
                        if (h.type && h.type in types_1.HostType) {
                            obj_1.name = h.name;
                            obj_1.type = h.type;
                        }
                        else {
                            var t = static_1.parseHost(h.name, true);
                            if (t) {
                                obj_1.name = t.name;
                                obj_1.type = t.type;
                            }
                        }
                    }
                    var p = h.port;
                    if (typeof p === 'number' && p > 0 && p < 65536) {
                        obj_1.port = p;
                    }
                    if (obj_1.name || obj_1.port) {
                        Object.defineProperty(obj_1, 'toString', {
                            value: function (options) { return static_1.fullHostName(obj_1, options); }
                        });
                        hosts_1.push(obj_1);
                    }
                }
            });
            if (hosts_1.length) {
                this.hosts = hosts_1;
            }
        }
        if (!('user' in this) && defaults.user && static_1.hasText(defaults.user)) {
            this.user = defaults.user.trim();
        }
        if (!('password' in this) && defaults.password && static_1.hasText(defaults.password)) {
            this.password = defaults.password.trim();
        }
        // Since the order of path segments is usually important, we set default
        // path segments as they are, but only when they are missing completely:
        if (!('path' in this) && Array.isArray(defaults.path)) {
            var s = defaults.path.filter(static_1.hasText);
            if (s.length) {
                this.path = s;
            }
        }
        // Missing default params are merged with the existing ones:
        if (defaults.params && typeof defaults.params === 'object') {
            var keys = Object.keys(defaults.params);
            if (keys.length) {
                if (this.params && typeof (this.params) === 'object') {
                    for (var a in defaults.params) {
                        if (!(a in this.params)) {
                            this.params[a] = defaults.params[a];
                        }
                    }
                }
                else {
                    this.params = {};
                    for (var b in defaults.params) {
                        this.params[b] = defaults.params[b];
                    }
                }
            }
        }
        return this;
    };
    return ConnectionString;
}());
exports.ConnectionString = ConnectionString;
(function () {
    // hiding prototype members:
    ['setDefaults', 'toString', 'hostname', 'port'].forEach(function (prop) {
        var desc = Object.getOwnPropertyDescriptor(ConnectionString.prototype, prop);
        desc.enumerable = false;
        Object.defineProperty(ConnectionString.prototype, prop, desc);
    });
})();
