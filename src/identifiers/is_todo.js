"use babel";

import regex_matches from "../utils/regex_matches.js";

var is_todo = function(lines, index) {
    if (lines[index].match(regex_matches["todo"])) {
        return true;
    }
    return false;
}

export default is_todo;
