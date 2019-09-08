"use babel";

import lstrip from "../utils/lstrip.js";
import begins_with from "../utils/begins_with.js";

import is_bullet from "../identifiers/is_bullet.js";
import is_enumerated from "../identifiers/is_enumerated.js";
import is_todo from "../identifiers/is_todo.js";

var collect_bullet = function(lines, index) {
    var output = [lines[index]];
    var leading_space = lines[index].replace(lstrip(lines[index]), '');
    index += 1;

    while (index < lines.length) {
        if (begins_with(lines[index], leading_space + ' ') &&
            lstrip(lines[index]) != '' &&
            !is_bullet(lines, index) &&
            !is_enumerated(lines, index) &&
            !is_todo(lines, index)) {

                output.push(lstrip(lines[index]))
                index += 1;
        }
        else {
            return [output.join(' '), index];
        }
    }
    return [output.join(' '), index];
}


export default collect_bullet;
