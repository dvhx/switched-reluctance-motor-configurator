// Switched Reluctance Motor (all possible combinations)
// linter: ngspicejs-lint
// global: document, console, CA, vec2, SC, window
"use strict";

SC.allCombinations = function (aMax) {
    // Try all combinations and fill table
    var i, s, c, m, o, tr, btn, all = [], seen_coil = {}, seen_components = {};
    SC.e.combinations_body.textContent = '';
    function col(aValue) {
        var td = document.createElement('td');
        td.textContent = aValue;
        tr.appendChild(td);
        return td;
    }
    for (c = 1; c < aMax + 1; c++) {
        for (m = 1; m < aMax + 1; m++) {
            s = new SRM(
                parseFloat(SC.e.motor_outer_diameter.value),
                parseFloat(SC.e.coil_diameter.value),
                c,
                m
            );
            s.setCanvas(SC.dummyCanvas);
            s.render();
            o = s.run();
            all.push(o);
        }
    }

    function score(a) {
        var score = 0;
        if (a.negative_overlap > 0) {
            score++;
        }
        if (a.error) {
            score++;
        }
        return score;
    }

    function score(a) {
        if (a.error) {
            if (a.negative_overlap) {
                return 0.5;
            }
            return 1;
        }
        return -1;
    }

    // sort by step angle
    if (SC.e.all_count_sorted.checked) {
        all = all.sort((a, b) => {
            if (score(a) === score(b)) {
                // Sort by smaller angle first
                var d = a.step_angle - b.step_angle;
                if (d !== 0) {
                    return d;
                }
                // If same angle, prefer the ones with smaller coil count
                return a.coil_count - b.coil_count;
            }
            return score(a) - score(b);
        });
    }

    for (i = 0; i < all.length; i++) {
        o = all[i];
        tr = document.createElement('tr');
        SC.e.combinations_body.appendChild(tr);
        // coil count (unseen number bold)
        var e = col(o.coil_count);
        if (!seen_coil[o.coil_count]) {
            e.style.fontWeight = 'bold';
        }
        seen_coil[o.coil_count] = true;
        // pole count
        col(o.pole_count);
        e = col(o.coil_count + o.pole_count);
        if (!seen_components[o.coil_count + o.pole_count]) {
            e.style.fontWeight = 'bold';
        }
        // both
        seen_components[o.coil_count + o.pole_count] = true;
        // steps
        col(o.error ? '-' : o.steps);
        // step angle
        col(o.step_angle ? o.step_angle.toFixed(3) + '°' : '-');
        // overlap
        col(o.overlap.toFixed(0) + '%');
        // integrity
        col(o.rotor_integrity.toFixed(0) + '%');
        // link to show visualization
        btn = document.createElement('a');
        btn.textContent = 'show';
        btn.title = JSON.stringify(o, undefined, 4);
        btn.href = 'index.html?coil_count=' + o.coil_count + '&pole_count=' + o.pole_count;
        tr.appendChild(btn);
        // issues
        col(o.error);
    }
};

SC.onCalculate = function () {
    // Calculate all combinations
    SC.allCombinations(parseInt(SC.e.all_count.value, 10));
};

window.addEventListener('DOMContentLoaded', function () {
    // Initialize page, first render
    SC.e = CA.elementsWithId();
    SC.e.calculate.onclick = SC.onCalculate;
    for (var k in SC.e) {
        SC.e[k].value = SC.config[k] || SC.e[k].value;
    }
    SC.onCalculate();
});

window.addEventListener('beforeunload', function () {
    // Save input values
    SC.config.motor_outer_diameter = parseFloat(SC.e.motor_outer_diameter.value);
    SC.config.coil_diameter = parseFloat(SC.e.coil_diameter.value);
    SC.config.all_count = parseFloat(SC.e.all_count.value);
    CA.storage.writeObject('BMCC.config', SC.config);
});
