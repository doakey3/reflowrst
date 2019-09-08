"use babel";
import lstrip from '../../lstrip.js';
import rstrip from '../../rstrip.js';

var get_field_breakpoints = function(line) {
    var leading_space = line.replace(lstrip(line), '');
    var line = lstrip(line);

    var field = line.match(/(^\:|^ +[\:]).*?:(?= |$)/)[0];
    var rest_of_text = line.substr(field.length);
    var betwixt = rest_of_text.replace(lstrip(rest_of_text), '');
    rest_of_text = lstrip(rest_of_text);

    var words = rest_of_text.split(" ");
    var breakpoints = [];
    var growing_string = field + betwixt + words[0];
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

export default get_field_breakpoints;
