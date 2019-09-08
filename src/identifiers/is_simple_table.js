"use babel";

import is_only from "../utils/is_only.js";
import strip from "../utils/strip.js";

var is_simple_table = function(lines, index) {
    var line = strip(lines[index]);
    if (is_only(line, ['=', ' ']) && line.split(' ').length > 1 && line.replace(/[^\=]/g).length > 3) {
        return true;
    }
    return false;
}

export default is_simple_table;
