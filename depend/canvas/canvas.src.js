// Canvas (custom build 2024-05-16--13-49-06)
"use strict";
// globals: document, window

var CA = window.CA || {};

// file: storage.js
// Simplified access to localStorage with extra checks
// globals: localStorage, window
// provide: storage


CA.storage = (function () {
    var self = {};
    self.ops = 0;

    self.keyExists = function (aKey) {
        // return true if key exists in storage
        if (typeof aKey !== 'string') {
            throw "CA.storage.keyExists key " + aKey + " is not string!";
        }
        try {
            var r = localStorage.hasOwnProperty(aKey);
            return r;
        } catch (e) {
            return false;
        }
    };

    self.removeItem = function (aKey) {
        // erase single key
        if (typeof aKey !== 'string') {
            throw "CA.storage.removeItem(key) - key " + aKey + " is not string!";
        }
        localStorage.removeItem(aKey);
    };

    self.size = function (aKey) {
        // return size of a key's value in bytes
        if (!localStorage.hasOwnProperty(aKey)) {
            return 0;
        }
        var r = localStorage.getItem(aKey).length;
        return r;
    };

    self.humanSize = function (aBytes) {
        // convert 12345 to 12.3 kB
        if (aBytes > 1024 * 1024) {
            return (aBytes / 1024 / 1024).toFixed(1) + ' MB';
        }
        if (aBytes > 1024) {
            return Math.ceil(aBytes / 1024) + ' kB';
        }
        return aBytes + ' B';
    };

    self.sizeAll = function (aHuman) {
        // return size used by entire storage
        var keys = self.keys(), i, t = 0, s = 0;
        for (i = 0; i < keys.length; i++) {
            t += self.size(keys[i]);
        }
        if (aHuman) {
            s = self.humanSize(t);
        } else {
            s = t;
        }
        return s;
    };

    self.keys = function () {
        // return all keys, alphabetically sorted
        var k, keys = [];
        for (k in localStorage) {
            if (localStorage.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys.sort();
    };

    self.removeAll = function (aNothing) {
        // erase entire storage
        if (aNothing !== undefined) {
            throw "CA.storage.removeAll does not require parameter, perhaps you wanted to call CA.storage.removeItem(key)";
        }
        localStorage.clear();
    };

    self.debug = function () {
        // return size occupied by each keys and first few bytes of data
        var i, keys = self.keys().sort(), s = [], c, t = 0;
        for (i = 0; i < keys.length; i++) {
            c = self.size(keys[i]);
            t += c;
            s.push(keys[i] + ': ' + c + ' B = ' + self.readString(keys[i], '').substr(0, 80) + '...');
        }
        s.push('Total size: ' + t + ' B (' + (t / 1000).toFixed(0) + ' kB)');
        s = s.join('\n');
        return s;
    };

    self.readString = function (aKey, aDefault) {
        // read string
        var r;
        if (typeof aKey !== 'string') {
            throw "CA.storage.readString key " + aKey + " is not string!";
        }
        if ((aDefault !== undefined) && (typeof aDefault !== 'string')) {
            throw "CA.storage.readString default " + aDefault + " is not string nor undefined!";
        }
        self.ops++;
        try {
            if (localStorage.hasOwnProperty(aKey)) {
                r = localStorage.getItem(aKey);
            } else {
                r = aDefault;
            }
        } catch (e) {
            console.warn('CA.storage.writeString: ' + e);
        }
        return r;
    };

    self.writeString = function (aKey, aValue) {
        // write string
        if (typeof aKey !== 'string') {
            throw "CA.storage.writeString key " + aKey + " is not string!";
        }
        if ((aValue !== undefined) && (typeof aValue !== 'string')) {
            throw "CA.storage.writeString value " + aValue + " is not string nor undefined!";
        }
        self.ops++;
        try {
            localStorage.setItem(aKey, aValue);
        } catch (e) {
            console.warn('CA.storage.writeString: ' + e);
        }
    };

    self.readBoolean = function (aKey, aDefault) {
        // read true/false, undefined as default, everything else is default with warning
        var s = self.readString(aKey);
        // console.info(aKey, aDefault, s, typeof s);
        if (s === undefined) {
            return aDefault || false;
        }
        if ((s !== 'true') && (s !== 'false')) {
            console.warn('CA.storage.readBoolean: unusual boolean value "' + s + '" for "' + aKey + '", using default');
            return aDefault || false;
        }
        return s === 'true';
    };

    self.writeBoolean = function (aKey, aValue) {
        // write true/false
        if ((aValue !== true) && (aValue !== false)) {
            console.warn('CA.storage.writeBoolean: unusual boolean value "' + aValue + '" for "' + aKey + '", using false');
        }
        var r = aValue === true ? 'true' : 'false';
        self.writeString(aKey, r);
    };

    self.readNumber = function (aKey, aDefault) {
        // read number, undefined as default, everything else is default with warning
        var s = self.readString(aKey), f;
        if (s === undefined) {
            return aDefault || 0;
        }
        f = parseFloat(s);
        if (isNaN(f)) {
            console.warn('CA.storage.readNumber: unusual number value "' + s + '" for "' + aKey + '", using default');
            return aDefault || 0;
        }
        return f;
    };

    self.writeNumber = function (aKey, aValue) {
        // write number
        if (typeof aValue !== 'number') {
            console.warn('CA.storage.writeNumber: unusual number value "' + aValue + '" for "' + aKey + '", using 0');
            self.writeString(aKey, '0');
        } else {
            self.writeString(aKey, aValue.toString());
        }
    };

    self.inc = function (aKey, aDefault) {
        // read number, increment it, write it back
        var i = self.readNumber(aKey, aDefault);
        i++;
        self.writeNumber(aKey, i);
        return i;
    };

    self.readObject = function (aKey, aDefault) {
        // read object, undefined as default, everything else is default with warning
        var s = self.readString(aKey), o;
        if (aDefault === undefined) {
            aDefault = {};
        }
        if (typeof aDefault !== 'object') {
            console.warn('CA.storage.readObject: default is not object in "' + aKey + '" but "' + aDefault + '", using {}');
            aDefault = {};
        }
        if (s === undefined) {
            return aDefault;
        }
        o = JSON.parse(s);
        if (typeof o !== 'object') {
            console.warn('CA.storage.readObject: unusual value "' + s + '" for "' + aKey + '", using default');
            return aDefault;
        }
        return o;
    };

    self.writeObject = function (aKey, aValue) {
        // write object
        if (typeof aValue !== 'object') {
            console.warn('CA.storage.writeObject: unusual object value "' + aValue + '" for "' + aKey + '", using {}');
            self.writeString(aKey, '{}');
        } else {
            self.writeString(aKey, JSON.stringify(aValue));
        }
    };

    self.readArray = function (aKey, aDefault) {
        // read array, undefined as default, everything else is default with warning
        var s = self.readString(aKey), o;
        if (aDefault === undefined) {
            aDefault = [];
        }
        if (!Array.isArray(aDefault)) {
            console.warn('CA.storage.readArray: default is not array in "' + aKey + '" but "' + aDefault + '", using []');
            aDefault = [];
        }
        if (s === undefined) {
            return aDefault;
        }
        o = JSON.parse(s);
        if (!Array.isArray(o)) {
            console.warn('CA.storage.readArray: unusual value "' + s + '" for "' + aKey + '", using default');
            return aDefault;
        }
        return o;
    };

    self.writeArray = function (aKey, aValue) {
        // write array
        if (!Array.isArray(aValue)) {
            console.warn('CA.storage.writeArray: unusual array value "' + aValue + '" for "' + aKey + '", using []');
            self.writeString(aKey, '[]');
        } else {
            self.writeString(aKey, JSON.stringify(aValue));
        }
    };

    return self;
}());


// file: utils/deg.js
CA.deg = function (aRadians) {
    // Convert radians to degrees
    return 180 * aRadians / Math.PI;
};


// file: utils/elementsWithId.js
CA.elementsWithId = function () {
    // Return all elements with defined id, if id is set, it is assumed they will be used so we can have them all at once
    function acceptNode() {
        return window.NodeFilter.FILTER_ACCEPT;
    }
    var w = document.createTreeWalker(document.body, window.NodeFilter.SHOW_ELEMENT, acceptNode, false),
        n = w.nextNode(),
        o = {};
    while (n) {
        if (n.id) {
            o[n.id] = n;
        }
        n = w.nextNode();
    }
    return o;
};


// file: utils/rad.js
CA.rad = function (aDegrees) {
    // Convert degrees to radians
    return Math.PI * aDegrees / 180;
};


// file: utils/urlParams.js
CA.urlParams = function () {
    // Get url parameters as associative array
    var i, o = {}, s = document.location.search.substr(1).split(/[\&\=]/);
    for (i = 0; i < s.length; i += 2) {
        o[s[i]] = s[i + 1];
    }
    return o;
};

