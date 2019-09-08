"use babel";

import is_only from "../utils/is_only.js";
import strip from "../utils/strip.js";
import lstrip from "../utils/lstrip.js";


var is_title = function(lines, index) {
    var valid_symbols = ["!", '"', "#", "$", "%", "&", "'", "(", ")", "*", "+", ",", "-", ".", "/", ":", ";", "<", "=", ">", "?", "@", "[", "\\", "]", "^", "_", "`", "{", "|", "}", "~"]

    if (index > lines.length - 2) {
        return false;
    }
    if (valid_symbols.indexOf(lstrip(lines[index + 1])[0]) != -1) {
        var symbol = lstrip(lines[index + 1])[0];

        if (is_only(strip(lines[index + 1]), [symbol]) &&
            strip(lines[index]).length == strip(lines[index + 1]).length) {
            return true;
        }
        return false;
    }
    return false;
}

export default is_title
