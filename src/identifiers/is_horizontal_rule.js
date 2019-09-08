"use babel";

import split_lines from "../utils/split_lines.js";
import is_only from "../utils/is_only.js";
import rstrip from "../utils/rstrip.js";

var is_horizontal_rule = function(lines, index) {
    var valid_chars = ["!", '"', "#", "$", "%", "&", "'", "(", ")", "*", "+", ",", "-", ".", "/", ":", ";", "<", "=", ">", "?", "@", "[", "\\", "]", "^", "_", "`", "{", "|", "}", "~"];
    if (rstrip(lines[index]).length >= 4) {
        var char = lines[index][0];
        if (valid_chars.indexOf(char) != -1 &&
            is_only(rstrip(lines[index]), char) &&
            index > 0 &&
            index < split_lines(rstrip(lines.join('\n'))).length - 1 &&
            rstrip(lines[index - 1]) == "" &&
            rstrip(lines[index + 1]) == "") {

            return true;
        }
    }
    return false;
}

export default is_horizontal_rule;
