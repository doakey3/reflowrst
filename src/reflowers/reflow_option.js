"use babel";

import strip from "../utils/strip.js";
import lstrip from "../utils/lstrip.js";
import space_fill from "../utils/space_fill.js";
import regex_matches from "../utils/regex_matches.js";

import reflow_paragraph from './reflow_paragraph.js';

var reflow_option = function(text, space) {
    var leading_space = text.replace(lstrip(text), '');
    var option_name = strip(text.match(regex_matches["option"])[0]);

    var rest = text.substr((leading_space + option_name).length)
    var betwixt = rest.replace(lstrip(rest), "").split('\n')[0];
    rest = strip(rest);

    var intro = leading_space + option_name + betwixt;
    var reflowed = reflow_paragraph(rest, space - intro.length);

    var r_lines = reflowed.split('\n');
    for (var i = 1; i < r_lines.length; i++) {
        r_lines[i] = space_fill(intro.length, " ") + r_lines[i];
    }

    reflowed = intro + strip(r_lines.join('\n'));

    return reflowed;
}

export default reflow_option;
