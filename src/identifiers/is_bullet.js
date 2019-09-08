"use babel";

import regex_matches from "../utils/regex_matches.js";

var is_bullet = function(lines, index) {
    if (lines[index].match(regex_matches["bullet"])) {
        return true;
    }
    return false;
}

export default is_bullet;
