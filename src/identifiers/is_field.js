"use babel";

import lstrip from "../utils/lstrip.js";
import regex_matches from "../utils/regex_matches.js";

import is_title from './is_title.js';
import is_directive from './is_directive.js';
import is_substitution_definition from './is_substitution_definition.js';
import is_comment from './is_comment.js';

var is_field = function(lines, index) {
    var leading_space = lines[index].replace(lstrip(lines[index]), "");

    var match = lines[index].match(regex_matches["field"]);
    if (match == null) {
        return false;
    }
    if (leading_space.length > 0 && index > 0) {
        if (lstrip(lines[index - 1]) == "") {
            return true;
        }
        else if (lines[index - 1].replace(lstrip(lines[index - 1]), "") == leading_space && is_field(lines, index - 1)) {
            return true;
        }
        else if (lines[index - 1].replace(lstrip(lines[index - 1]), "").length > leading_space.length) {
            return true;
        }
        else if (index > 1 && is_title(lines, index - 2)) {
            return true;
        }
        else if (lines[index - 1].replace(lstrip(lines[index - 1]), "").length < leading_space.length && (is_directive(lines, index - 1) || is_substitution_definition(lines, index - 1) || is_comment(lines, index - 1))) {
            return true;
        }
        else {
            return false;
        }
    }
    return true
}

export default is_field;
