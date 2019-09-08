"use babel";

import regex_matches  from '../utils/regex_matches.js';
import lstrip from "../utils/lstrip.js";
import rstrip from "../utils/rstrip.js";
import strip from "../utils/strip.js";
import space_fill from "../utils/space_fill.js";

import reflow_paragraph from './reflow_paragraph.js';

var reflow_field = function(text, space) {
    var leading_space = text.replace(lstrip(text), '');
    var field_name = strip(text.match(regex_matches["field"])[0]);

    var rest = text.substr((leading_space + field_name).length)

    if (strip(rest) == "") {
        return leading_space + field_name + rest;
    }

    var betwixt = rest.replace(lstrip(rest), "").split('\n')[0];
    rest = lstrip(rest);

    var intro = leading_space + field_name + betwixt;

    var split = rest.split('\n');
    var paragraphs = [[split[0]]];

    split.splice(0, 1);

    for (var i = 0; i < split.length; i++) {
        split[i] = lstrip(split[i]);
    }

    for (var i = 0; i < split.length; i++) {
        if (split[i].length > 0) {
            paragraphs[paragraphs.length - 1].push(split[i]);
        }
        else {
            paragraphs.push([""]);
            if (i < split.length - 1) {
                paragraphs.push([]);
            }
        }
    }

    for (var i = 0; i < paragraphs.length; i++) {
        paragraphs[i] = paragraphs[i].join('\n');
    }

    var reflowed = [];

    var new_space = space - intro.length;
    if (space > 0 && new_space < 1) {
        new_space = intro.length;
    }
    for (var i = 0; i < paragraphs.length; i++) {
        reflowed.push(rstrip(reflow_paragraph(paragraphs[i], new_space)));
    }

    reflowed = reflowed.join('\n');

    var r_lines = reflowed.split('\n');
    for (var i = 1; i < r_lines.length; i++) {
        r_lines[i] = space_fill(intro.length, " ") + r_lines[i];
    }

    reflowed = intro + r_lines.join('\n');

    return reflowed;
}

export default reflow_field;
