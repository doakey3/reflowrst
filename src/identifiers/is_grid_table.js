"use babel";

import begins_with from "../utils/begins_with.js";
import lstrip from "../utils/lstrip.js";

var is_grid_table = function(lines, index) {
    if (begins_with(lstrip(lines[index]), '+---')) {
        return true;
    }
}

export default is_grid_table;
