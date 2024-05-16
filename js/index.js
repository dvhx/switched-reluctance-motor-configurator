// Main page
"use strict";
// linter: ngspicejs-lint
// global: document, window, CA, console, SRM

var SC = window.SC || {};

SC.onConfigChanged = function () {
    // Change in input value
    SC.motor = new SRM(
        SC.e.motor_outer_diameter.value,
        SC.e.coil_diameter.value,
        SC.e.coil_count.value,
        SC.e.pole_count.value
    );
    SC.motor.setCanvas('b');
    SC.motor.render();
};

SC.onStep = function () {
    // Move motor one step forward
    try {
        SC.motor.step();
    } catch (e) {
        SC.motor.context.fillStyle = 'red';
        SC.motor.context.textAlign = 'center';
        SC.motor.context.textBaseline = 'top';
        SC.motor.context.fillText(e, SC.motor.canvas.width / 2, 20);
        console.log(e);
    }
};

window.addEventListener('DOMContentLoaded', function () {
    // Initialize window, values from config or url, first render
    var up = CA.urlParams();
    SC.e = CA.elementsWithId();
    for (var k in SC.e) {
        SC.e[k].value = SC.config[k] || SC.e[k].value;
        if (up[k]) {
            SC.e[k].value = up[k];
        }
        SC.e[k].oninput = SC.onConfigChanged;
    }
    SC.onConfigChanged();
    SC.e.step2.onclick = SC.onStep;
    window.addEventListener('visibilitychange', SC.motor.render);
    window.addEventListener('resize', SC.motor.render);
    window.requestAnimationFrame(SC.onConfigChanged);
});

window.addEventListener('beforeunload', function () {
    // Save input values
    SC.config.motor_outer_diameter = parseFloat(SC.e.motor_outer_diameter.value);
    SC.config.coil_diameter = parseFloat(SC.e.coil_diameter.value);
    SC.config.coil_count = parseFloat(SC.e.coil_count.value);
    SC.config.pole_count = parseFloat(SC.e.pole_count.value);
    CA.storage.writeObject('BMCC.config', SC.config);
});
