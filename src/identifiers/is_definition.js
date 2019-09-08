"use babel";

import lstrip from "../utils/lstrip.js";
import begins_with from "../utils/begins_with.js";

var is_definition = function(lines, index) {
    if (index < lines.length - 1) {
        var leading_space = lines[index].replace(lstrip(lines[index]), "");
        if (lstrip(lines[index + 1]) != "" && begins_with(lines[index + 1], leading_space + " ")) {
            return true;
        }
    }
    return false;
}

export default is_definition;
