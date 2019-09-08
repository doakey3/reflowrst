"use babel";

import lstrip from "../utils/lstrip.js";
import get_enumerator_type from "../utils/get_enumerator_type.js";
import deromanize from "../utils/deromanize.js";
import regex_matches from "../utils/regex_matches.js";

import is_title from './is_title.js';

var is_enumerated = function(lines, index) {
    var leading_space = lines[index].replace(lstrip(lines[index]), "");
    var match = lines[index].match(regex_matches["enumerator"]);
    if (match == null) {
        return false;
    }
    var enumerator = lstrip(match[0]);
    var enumerator_type = get_enumerator_type(enumerator);

    if (enumerator_type.match(/ROMAN/)) {
        if (!deromanize(enumerator.replace(/\(|\)|\./g, ""))) {
            return false;
        }
    }

    if (leading_space.length > 0 && index > 0) {
        if (index == 0) {
            return true;
        }
        else if (lstrip(lines[index - 1]) == "") {
            return true;
        }
        else if (lines[index - 1].replace(lstrip(lines[index - 1]), "") == leading_space && is_enumerated(lines, index - 1)) {
            return true;
        }
        else if (index > 1 && is_title(lines, index - 2)) {
            return true;
        }
        else {
            return false;
        }
    }
    return true
}

export default is_enumerated;
