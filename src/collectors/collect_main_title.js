"use babel";

import rstrip from "../utils/rstrip.js"

var collect_main_title = function(lines, index) {
    var output = [rstrip(lines[index]), rstrip(lines[index + 1]), rstrip(lines[index + 2])].join('\n');
    return [output, index + 3];
}

export default collect_main_title;
