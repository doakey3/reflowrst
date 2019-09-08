"use babel";

import is_title from "../identifiers/is_title.js";
import lstrip from "../utils/lstrip.js";
import regex_matches from "../utils/regex_matches.js";

var is_option = function(lines, index) {
    var leading_space = lines[index].replace(lstrip(lines[index]), "");

    if (lines[index].match(regex_matches["option"]) != null) {

        if (leading_space.length > 0 && index > 0) {
            if (lstrip(lines[index - 1]) == "") {
                return true;
            }
            else if (lines[index - 1].replace(lstrip(lines[index - 1]), "") == leading_space && is_option(lines, index - 1)) {
                return true;
            }
            else if (lines[index - 1].replace(lstrip(lines[index - 1]), "").length > leading_space.length) {
                return true;
            }
            else if (index > 1 && is_title(lines, index - 2)) {
                return true;
            }
            else {
                return false;
            }
        }

        return true;
    }
    return false;
}

export default is_option;
