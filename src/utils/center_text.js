"use babel";

import space_fill from './space_fill.js';

var center_text = function(line, space) {
    // Pad left and right of a string to center it within space
    // Must be using monospace font to work

    var remaining = space - line.length;
    var space_count = Math.floor(remaining / 2)
    var output = space_fill(space_count, ' ') + line + space_fill(remaining - space_count, ' ');
    return output;
}

export default center_text;
