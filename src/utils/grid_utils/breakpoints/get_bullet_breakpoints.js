"use babel";
import lstrip from '../../lstrip.js';
import rstrip from '../../rstrip.js';

var get_bullet_breakpoints = function(line) {
    var leading_space = line.replace(lstrip(line), '');
    var line = lstrip(line);
    var words = line.split(" ");

    var breakpoints = [];
    var growing_string = words.splice(0, 2).join(" ");
    for (var i = 0; i < words.length; i++) {
        growing_string += words[i] + " ";
        breakpoints.push(rstrip(growing_string).length);
    }
    breakpoints = Array.from(new Set(breakpoints)).sort(function(a, b) {
        if (a < b) return -1;
        if (a > b) return 1;
    });

    for (var i = 0; i < breakpoints.length; i++) {
        breakpoints[i] += leading_space.length;
    }
    return breakpoints;
}

export default get_bullet_breakpoints;
