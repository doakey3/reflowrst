"use babel";
import get_sum from '../get_sum.js';

import get_span_from_span_group from './get_span_from_span_group.js';
import get_span_row_count from './get_span_row_count.js';

var get_table_row_heights = function(table, spans) {
    /*
    Get the heights of the rows of the output table (number of lines)
    */
    var span_remainders = {};
    for (var i = 0; i < spans.length; i++) {
        span_remainders[spans[i].toString()] = 0;
    }

    var heights = [];
    for (var i = 0; i < table.length; i++) {
        heights.push(-1);
    }

    for (var row = 0; row < table.length; row++) {
        for (var column = 0; column < table[row].length; column++) {
            var text = table[row][column];
            var span = get_span_from_span_group(row, column, spans);
            var row_count = get_span_row_count(span);
            var height = text.split('\n').length;
            if (row_count == 1 && height > heights[row]) {
                heights[row] = height;
            }
        }
    }

    for (var row = 0; row < table.length; row++) {
        for (var column = 0; column < table[row].length; column++) {
            var span = get_span_from_span_group(row, column, spans);
            var row_count = get_span_row_count(span);
            if (row_count > 1) {
                var text_row = span[0][0];
                var text_column = span[0][1];
                var text = table[text_row][text_column];
                var height = text.split('\n').length - (row_count - 1);
                var add_row = 0;
                while (height > heights.slice(text_row, text_row + row_count).reduce(get_sum)) {
                    heights[text_row + add_row] += 1;
                    if (add_row + 1 < row_count) {
                        add_row += 1;
                    }
                    else {
                        add_row = 0;
                    }
                }
            }
        }
    }
    return heights;
}

export default get_table_row_heights;
