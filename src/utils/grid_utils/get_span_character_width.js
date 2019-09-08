"use babel";
import get_span_column_count from './get_span_column_count.js';

var get_span_character_width = function(span, widths, interspace) {
    /*
    Sum the character widths of a span
    */
    var interspace = interspace || "";

    var start_column = span[0][1];
    var column_count = get_span_column_count(span);
    var total_width = 0;
    for (var i = start_column; i < start_column + column_count; i++) {
        total_width += widths[i];
    }
    if (interspace == "") {
        total_width += column_count - 1;
    }
    else {
        total_width += (interspace.length * (column_count - 1))
    }
    return total_width;
}

export default get_span_character_width;
