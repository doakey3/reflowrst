"use babel";
import regex_matches from "../utils/regex_matches.js";

var is_comment = function(lines, index) {
    if (lines[index].match(regex_matches["comment"]) != null) {
        return true
    }
    return false;
}

export default is_comment;
