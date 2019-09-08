"use babel";
import is_field from '../identifiers/is_field.js';
import collect_field from '../collectors/collect_field.js';
import reflow_field from './reflow_field.js';
import lstrip from '../utils/lstrip.js';

var reflow_directive = function(text, space) {
    var lines = text.split('\n');
    var leading_space = lines[0].replace(lstrip(lines[0]), "");
    var reflowed = [lines[0]];
    lines.splice(0, 1);

    var i = 0;
    var holder = [];
    while (i < lines.length) {
        if (is_field(lines, i)) {
            //console.log(lines[i]);
            holder = collect_field(lines, i);
            reflowed.push(reflow_field(holder[0], space));
            i = holder[1];
        }
        else {
            break;
        }
    }
    lines.splice(0, i + 1);
    reflowed = reflowed.concat(lines);
    return reflowed.join("\n");
}

export default reflow_directive;
