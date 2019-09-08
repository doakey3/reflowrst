"use babel";

import regex_matches  from '../utils/regex_matches.js';
import lstrip from "../utils/lstrip.js";
import strip from "../utils/strip.js";
import space_fill from "../utils/space_fill.js";

import reflow_paragraph from "./reflow_paragraph.js";

var reflow_enumerated = function(text, space) {
    var leading_space = text.replace(lstrip(text), '');
    var enumerator = strip(text.match(regex_matches["enumerator"])[0]);

    var rest = text.substr((leading_space + enumerator).length)
    var betwixt = rest.replace(lstrip(rest), "").split('\n')[0];
    rest = strip(rest);

    var intro = leading_space + enumerator + betwixt;
    var reflowed = reflow_paragraph(rest, space - intro.length);

    var r_lines = reflowed.split('\n');
    for (var i = 1; i < r_lines.length; i++) {
        r_lines[i] = space_fill(intro.length, " ") + r_lines[i];
    }

    reflowed = intro + r_lines.join('\n');

    return reflowed;
}

export default reflow_enumerated;
