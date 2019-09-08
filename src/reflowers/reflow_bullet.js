"use babel";

import lstrip from "../utils/lstrip.js";
import rstrip from "../utils/rstrip.js";
import strip from "../utils/strip.js";
import space_fill from "../utils/space_fill.js";

import regex_matches  from "../utils/regex_matches.js";
import reflow_paragraph from "./reflow_paragraph.js";

var reflow_bullet = function(text, space) {
    var leading_space = text.replace(lstrip(text), '');
    var first_char = lstrip(text).match(regex_matches["bullet"])[0];
    var rest = strip(text.substr(leading_space.length + first_char.length));

    var interspace = ' ';

    var intro = leading_space + first_char + interspace;

    var new_space = space - intro.length;
    if (space > 0 && new_space < 1) {
        new_space = intro.length;
    }
    var reflowed = reflow_paragraph(rest, new_space);

    var r_lines = reflowed.split('\n');
    for (var i = 1; i < r_lines.length; i++) {
        r_lines[i] = space_fill(intro.length, " ") + r_lines[i];
    }

    reflowed = intro + r_lines.join('\n');
    return reflowed;
}

export default reflow_bullet;
