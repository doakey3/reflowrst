"use babel";

import rstrip from "../utils/rstrip.js";


var collect_simple_table = function(lines, index) {
    var header_line = lines[index];
    var output = [lines[index]];
    for (var i = index + 1; i < lines.length; i++) {
        output.push(lines[i]);
        if (rstrip(lines[i]) == header_line) {
            if (i == lines.length - 1) {
                return [output.join('\n'), i + 1];
            }
            else if (rstrip(lines[i + 1]) == "") {
                return [output.join('\n'), i + 1];
            }
        }
    }

    return [output.join('\n'), i + 1];
}


export default collect_simple_table;
