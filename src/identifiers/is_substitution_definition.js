"use babel";

import regex_matches from "../utils/regex_matches.js";

var is_substitution_definition = function(lines, index) {
    if (lines[index].match(regex_matches["substitution_definition"]) != null) {
        return true;
    }
    return false;
}

export default is_substitution_definition;
