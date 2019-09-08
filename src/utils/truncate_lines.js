import rstrip from './rstrip.js'
import split_lines from './split_lines.js';

var truncate_lines = function(text) {
    var lines = split_lines(text);

    var pre_split = 0;
    for (var i = 0; i < lines.length; i++) {
        if (rstrip(lines[i]) == "") {
            pre_split += 1;
        }
        else {
            break;
        }
    }

    lines.splice(0, pre_split);

    return rstrip(lines.join('\n'));
}

export default truncate_lines;
