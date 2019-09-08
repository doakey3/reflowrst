"use babel";
import get_span_row_count from './get_span_row_count.js';

var get_span_line_count = function(span, row_heights) {
    /*
    This function gets the total line count of a span
    */
    var start_row = span[0][0];
    var row_count = get_span_row_count(span);
    var line_count = 0;
    for (var i = start_row; i < start_row + row_count; i++) {
        line_count += row_heights[i];
    }
    line_count += row_count - 1;
    return line_count;
}

export default get_span_line_count;
