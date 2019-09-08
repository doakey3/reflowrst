"use babel";

import split_lines from "../utils/split_lines.js";
import lstrip from "../utils/lstrip.js";

var collect_grid_table = function(lines, index) {
    var output = [];
    for (var i = index; i < lines.length; i++) {
        var first_char = lstrip(lines[i])[0];
        if (first_char != "|" && first_char != '+') {
            return [output.join('\n'), i];
        }
        output.push(lines[i]);
    }

    return [output.join('\n'), i];
}

export default collect_grid_table;
