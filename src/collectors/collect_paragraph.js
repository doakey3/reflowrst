"use babel";

import lstrip from "../utils/lstrip.js";
import begins_with from "../utils/begins_with.js";
import strip from "../utils/strip.js";
import replace_all from "../utils/replace_all.js";

var collect_paragraph = function(lines, index) {
    var output = [lines[index]];
    var leading_space = lines[index].replace(lstrip(lines[index]), '');
    index += 1;

    while (index < lines.length) {
        if (begins_with(lines[index], leading_space) && lstrip(lines[index]) != '') {
            output.push(lines[index]);
            index += 1;
        }
        else {
            var text = output.join("\n");
            return [text, index];
        }
    }
    var text = output.join("\n");
    return [text, index];
}


export default collect_paragraph;
