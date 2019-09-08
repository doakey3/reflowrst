"use babel";

import is_only from "../utils/is_only.js";
import rstrip from "../utils/rstrip.js";
import lstrip from "../utils/lstrip.js";
import strip from "../utils/strip.js";

var is_main_title = function(lines, index) {
    var valid_symbols = ["!", '"', "#", "$", "%", "&", "'", "(", ")", "*", "+", ",", "-", ".", "/", ":", ";", "<", "=", ">", "?", "@", "[", "\\", "]", "^", "_", "`", "{", "|", "}", "~"]
    var lines = lines;
    var index = index;
    if (index > lines.length - 3) {
        return false;
    }

    if (valid_symbols.indexOf(lstrip(lines[index])[0]) != -1) {
        var symbol = lstrip(lines[index])[0];

        if (is_only(strip(lines[index]), [symbol]) &&
            is_only(strip(lines[index + 2]), [symbol]) &&
            strip(lines[index]).length >= rstrip(lines[index + 1]).length &&
            strip(lines[index]).length == strip(lines[index + 2]).length) {

            return true;
        }
        return false;
    }
    return false;
}

export default is_main_title;
