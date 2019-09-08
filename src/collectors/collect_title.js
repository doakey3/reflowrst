"use babel";

import rstrip from "../utils/rstrip.js";

var collect_title = function(lines, index) {
    var output = [rstrip(lines[index]), rstrip(lines[index + 1])].join('\n');
    return [output, index + 2];
}

export default collect_title;
