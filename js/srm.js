// Switched Reluctance Motor (single configuration)
// linter: ngspicejs-lint
// global: document, console, CA, vec2, SC, window
"use strict";

function SRM(aMotorOuterDiameter, aCoilDiameter, aCoilCount, aPoleCount) {
    // Constructor
    this.motor_outer_diameter = aMotorOuterDiameter;
    this.coil_diameter = aCoilDiameter;
    this.coil_rim_radius = (aMotorOuterDiameter - aCoilDiameter) / 2;
    this.coil_count = 1 * aCoilCount;
    this.pole_count = 1 * aPoleCount;
    this.angle = 0;
    this.negative_overlap = 0;
    var i;
    // coils
    this.coil_angle = [];
    for (i = 0; i < this.coil_count; i++) {
        this.coil_angle.push(i * 360 / this.coil_count);
    }
    // poles
    this.pole_angle = [];
    for (i = 0; i < this.pole_count; i++) {
        this.pole_angle.push(i * 360 / this.pole_count);
    }
}

SRM.prototype.setCanvas = function (aCanvasOrId) {
    // Assign this SRM to a canvas for future rendering
    var c = typeof aCanvasOrId === 'string' ? document.getElementById(aCanvasOrId) : aCanvasOrId;
    this.canvas = c;
    this.context = c.getContext('2d');
    this.zoom = 0.8 * this.canvas.width / this.motor_outer_diameter;
};

SRM.prototype.line = function (aX1, aY1, aX2, aY2, aColor) {
    // Draw line
    this.context.lineWidth = 1;
    this.context.strokeStyle = aColor || 'black';
    this.context.beginPath();
    this.context.moveTo(aX1, aY1);
    this.context.lineTo(aX2, aY2);
    this.context.stroke();
};

SRM.prototype.circle = function (aX, aY, aRadius, aColor) {
    // Draw circle
    this.context.lineWidth = 1;
    this.context.strokeStyle = aColor || 'black';
    this.context.beginPath();
    this.context.arc(aX, aY, aRadius, 0, 2 * Math.PI);
    this.context.stroke();
};

SRM.prototype.circleAtAngle = function (aAngleDeg, aColor, aFill) {
    // Draw circle on the coil rim at a given angle
    var a = CA.rad(aAngleDeg);
    var x = this.canvas.width / 2 + this.coil_rim_radius * Math.sin(a) * this.zoom;
    var y = this.canvas.height / 2 - this.coil_rim_radius * Math.cos(a) * this.zoom;
    var x_inner = this.canvas.width / 2 + (this.coil_rim_radius - this.coil_diameter / 2) * Math.sin(a) * this.zoom;
    var y_inner = this.canvas.height / 2 - (this.coil_rim_radius - this.coil_diameter / 2) * Math.cos(a) * this.zoom;
    var r = (this.coil_diameter / 2) * this.zoom;
    this.context.lineWidth = 3;
    this.context.strokeStyle = aColor || 'black';
    this.context.fillStyle = aFill || 'black';
    this.context.beginPath();
    this.context.arc(x, y, r, 0, 2 * Math.PI);
    if (aColor) {
        this.context.stroke();
    }
    if (aFill) {
        this.context.fill();
    }
    return {x, y, x_inner, y_inner, r, angle: aAngleDeg};
};

SRM.prototype.arrow = function (aX1, aY1, aX2, aY2, aColor) {
    // Draw horizontal arrow
    this.line(aX1, aY1, aX2, aY2, aColor);
    this.line(aX1, aY1, aX1 + 15, aY1 - 5, aColor);
    this.line(aX1, aY1, aX1 + 15, aY1 + 5, aColor);
    this.line(aX2, aY1, aX2 - 15, aY1 - 5, aColor);
    this.line(aX2, aY1, aX2 - 15, aY1 + 5, aColor);
};

SRM.prototype.render = function () {
    // Render current configuration and state
    if (!this.canvas) {
        return;
    }
    var i,
        w = this.canvas.width,
        h = this.canvas.height,
        w2 = w / 2,
        h2 = h / 2,
        a,
        xyr;
    // calculate rotor integrity (percentual width of the gap between 2 poles)
    a = this.coil_rim_radius;
    var pole_distance = Math.sqrt(2 * a * a - 2 * a * a * Math.cos(2 * Math.PI / this.pole_count));
    var rotor_integrity = pole_distance / (2 * (this.coil_diameter / 2)) - 1;
    if (this.pole_count <= 1) {
        rotor_integrity = 1;
    }
    this.rotor_integrity = rotor_integrity * 100;
    // clear
    this.context.clearRect(0, 0, w, h);
    // center
    this.context.fillStyle = 'black';
    this.context.fillRect(w2 - 1, h2 - 1, 2, 2);
    // motor outer diameter
    a = this.zoom * this.motor_outer_diameter / 2;
    this.circle(w2, h2, a, '#000000');
    this.arrow(w2 - a, h - 10.5, w2 + a, h - 10.5, 'black');
    this.context.textAlign = 'center';
    this.context.textBaseline = 'bottom';
    this.context.fillText(this.motor_outer_diameter, w2, h - 10);
    // coil outer diameter
    a = this.zoom * this.coil_diameter / 2;
    this.arrow(w2 - a, h - 35.5, w2 + a, h - 35.5, 'black');
    this.context.fillText(this.coil_diameter, w2, h - 35);
    // legend
    this.context.textAlign = 'left';
    this.context.textBaseline = 'top';
    this.context.fillStyle = 'cyan';
    this.context.fillText('Coil = Cyan (stator)', 0, 0);
    this.context.fillStyle = 'purple';
    this.context.fillText('Pole = Purple (rotor, ' + this.rotor_integrity.toFixed(0) + '% integrity)', 0, 10);
    // coils
    this.coil_centers = [];
    this.context.textAlign = 'center';
    this.context.textBaseline = 'bottom';
    this.steps = [];
    for (i = 0; i < this.coil_angle.length; i++) {
        xyr = this.circleAtAngle(this.coil_angle[i], undefined, 'cyan');
        this.coil_centers.push(xyr);
        this.context.fillStyle = 'blue';
        var np = this.nearestPole(i);
        this.steps.push(np);
        this.context.fillText('L' + i + ' (' + np.angle.toFixed(0) + '° to P' + np.pole_index + ')', xyr.x, xyr.y);
    }
    // poles
    this.pole_centers = [];
    this.context.textBaseline = 'top';
    for (i = 0; i < this.pole_angle.length; i++) {
        xyr = this.circleAtAngle(this.angle + this.pole_angle[i], 'purple');
        this.pole_centers.push(xyr);
        this.context.fillStyle = 'purple';
        this.context.fillText('P' + i, xyr.x, xyr.y);
        this.line(w2, h2, xyr.x_inner, xyr.y_inner, i === 0 ? 'black' : 'purple');
    }
    // legend
    this.context.textAlign = 'left';
    this.context.textBaseline = 'top';
    this.context.fillStyle = 'black';
    if (this.step_angle) {
        this.context.fillText((360 / this.step_angle).toFixed(0) + ' steps (' + this.step_angle.toFixed(1) + '° per step)', 0, 20);
    }
};

SRM.prototype.nearestPole = function (aCoilIndex) {
    // For given coil find nearest pole and clockwise angle to it
    var i,
        coil_angle = this.coil_angle[aCoilIndex], d, m = 999, p, v1, v2, mm = 0,
        coil_angle_rad = CA.rad(coil_angle),
        pole_angle,
        pole_angle_rad,
        same_distance = false,
        buf = [];
    for (i = 0; i < this.pole_angle.length; i++) {
        pole_angle = this.angle + this.pole_angle[i];
        pole_angle_rad = CA.rad(pole_angle);
        v1 = vec2(Math.sin(coil_angle_rad), Math.cos(coil_angle_rad));
        v2 = vec2(Math.sin(pole_angle_rad), Math.cos(pole_angle_rad));
        d = v1.angleTo(v2);
        //console.log('pole_index', i, 'd', d, 'm', m, 'coil_angle', CA.deg(coil_angle_rad), 'pole_angle', CA.deg(pole_angle_rad), 'base', this.pole_angle[i]);
        if (Math.abs(d) < m) {
            //console.log('d', d, 'm', m, 'd-m', Math.abs(d - m));
            m = Math.abs(d);
            mm = d;
            p = i;
        }
        buf.push({pole_index: i, angle: d, abs_angle: Math.abs(d)});
        //console.log(i, coil_angle, coil_angle_rad, d, m, p, pole_angle, pole_angle_rad);
    }
    // indicate issue where 2 poles are at the same distance (one CW other CCW)
    buf = buf.filter((a) => a.abs_angle > SC.epsilon).sort((a,b) => a.abs_angle - b.abs_angle);
    same_distance = false;
    if (buf.length >= 2 && (Math.abs(buf[0].abs_angle - buf[1].abs_angle) < SC.epsilon)) {
        same_distance = true;
    }

    return {
        coil_index: aCoilIndex,
        pole_index: p,
        abs_angle: CA.deg(m),
        abs_angle_rad: m,
        angle: CA.deg(mm),
        angle_rad: mm,
        same_distance
    };
};

SRM.prototype.step = function () {
    // Find which coil should be used next and rotate motor
    var s = this.steps.filter((a) => a.angle < -SC.epsilon).sort((a, b) => a.abs_angle - b.abs_angle);
    // analyze various wrong states
    if (s.length === 0) {
        // not enough components
        if (this.coil_count + this.pole_count < 3) {
            throw "Not enough coils/poles";
        }
        // all coils already captured pole
        var i, all_coils_occupied = true;
        for (i = 0; i < this.coil_angle.length; i++) {
            if (this.nearestPole(i).abs_angle > SC.epsilon) {
                all_coils_occupied = false;
                break;
            }
        }
        if (all_coils_occupied) {
            throw "No movement";
        }
        // Two magnets in same angle in opposite directions
        var s2 = this.steps.filter((a) => a.abs_angle > SC.epsilon).sort((a, b) => a.abs_angle - b.abs_angle);
        if (s2.length > 0 && s2[0].same_distance) {
            throw "Chaotic";
        }
        throw "Invalid motor configuration";
    }
    if (s[0].abs_angle >= 180 - SC.epsilon) {
        throw "Angle too big >= 180°";
    }
    if (s[0].same_distance) {
        throw "Chaotic";
    }
    if (this.rotor_integrity < 0) {
        throw "Poles are overlaping!";
    }
    // check for negative overlap
    if (this.pole_count > 1) {
        var a = this.coil_angle[s[0].coil_index];
        var b = this.angle + this.pole_angle[s[0].pole_index + 1];
        var c = this.overlap(b - a);
        if (c && ((c < this.negative_overlap) || (this.negative_overlap === 0))) {
            this.negative_overlap = c;
        }
    }
    this.step_angle = -s[0].angle;
    this.angle -= s[0].angle;
    this.render();
    return this.angle < 360 - SC.epsilon;
};

SRM.prototype.overlap = function (aCoilPoleAngleDeg) {
    // Calculate overlap of coil and pole for given coil-pole angle
    var r = this.coil_rim_radius,
        a = this.coil_diameter / 2,
        x = 2 * r * Math.sin(CA.rad(aCoilPoleAngleDeg) / 2);
    if (x > 2 * a) {
        return 0;
    }
    return (2 * a * a * Math.acos(x / (2 * a)) - (x / 2) * Math.sqrt(4*a*a - x*x)) / (Math.PI * a * a);
};

SRM.prototype.run = function () {
    // Make one full 360 run, return stats
    var i = 1,
        angles = {},
        error;
    try {
        while (this.step()) {
            angles[this.step_angle.toFixed(3)] = 1;
            if (i > this.coil_count * this.pole_count) {
                throw "More than expected amount of steps";
            }
            i++;
        }
        if (Object.keys(angles).length !== 1) {
            throw "Inconsistent angle: " + Object.keys(angles).join(', ');
        }
    } catch (e) {
        error = e;
        //throw e;
    }
    if (this.negative_overlap > 0 && !error) {
        error = 'Negative overlap ' + (100 * this.negative_overlap).toFixed(1) + '%';
    }
    this.step_angle = this.step_angle || 0;

    return {
        coil_count: this.coil_count,
        pole_count: this.pole_count,
        component_count: this.coil_count + this.pole_count,
        steps: i,
        step_angle: parseFloat(this.step_angle.toFixed(3)),
        overlap: 100 * this.overlap(this.step_angle),
        negative_overlap: 100 * this.negative_overlap,
        rotor_integrity: this.rotor_integrity,
        error
    };
};

