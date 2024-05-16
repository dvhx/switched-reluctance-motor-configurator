// Global variables all in one place
"use strict";
// globals: document, window, CA, SRM

var SC = window.SC || {};

// Error by which to judge "same" floats like angles etc
SC.epsilon = 0.000001;

// Values in all inputs stored between refresh
SC.config = CA.storage.readObject('BMCC.config', {});

// Dummy canvas to speed up all combinations
SC.dummyCanvas = {
    getContext: function () { return SC.dummyCanvas; },
    clearRect: function () { return; },
    fillText: function () { return; },
    fillRect: function () { return; },
    stroke: function () { return; },
    fill: function () { return; },
    beginPath: function () { return; },
    moveTo: function () { return; },
    lineTo: function () { return; },
    arc: function () { return; }
};

// Motor
SC.motor = new SRM(30, 6, 3, 4);

