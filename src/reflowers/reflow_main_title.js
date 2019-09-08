"use babel";

import split_lines from "../utils/split_lines.js";
import center_text from "../utils/center_text.js";
import rstrip from "../utils/rstrip.js";
import lstrip from "../utils/lstrip.js";
import strip from "../utils/strip.js";
import space_fill from "../utils/space_fill.js";

var reflow_main_title = function(text, space) {
    var space = space;
    var lines = split_lines(text);
    var leading_space = lines[0].replace(lstrip(lines[0]), '');
    for (var i = 0; i < lines.length; i++) {
        lines[i] = lines[i].substr(leading_space.length);
    }

    lines[1] = lstrip(lines[1]);

    var title_space = lines[0].length;
    var symbol = lstrip(lines[0])[0];

    if (title_space <= space) {
        lines[1] = rstrip(center_text(lines[1], title_space));
    }
    else if (rstrip(lines[1]).length <= space) {
        lines[0] = space_fill(space, symbol);
        lines[1] = rstrip(center_text(lines[1], space));
        lines[2] = lines[0];
    }
    else {
        lines[0] = space_fill(strip(lines[1]).length, symbol);
        lines[1] = strip(lines[1]);
        lines[2] = lines[0];
    }

    for (var i = 0; i < lines.length; i++) {
        lines[i] = leading_space + lines[i];
    }

    return lines.join('\n');
}

export default reflow_main_title;
