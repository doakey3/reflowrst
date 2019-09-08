"use babel";

import lstrip from "../utils/lstrip.js";
import begins_with from "../utils/begins_with.js";

var collect_definition = function(lines, index) {
    var output = [lines[index]];

    var leading_space = lines[index].replace(lstrip(lines[index]), "");

    index += 1;

    while (index < lines.length) {
        if (begins_with(lines[index], leading_space) &&
            lstrip(lines[index]) != " ") {

            output.push("    " + lstrip(lines[index]))
            index += 1;
        }
        else {
            return [output.join("\n"), index];
        }
    }
    return [output.join("\n"), index];
}


export default collect_definition;
