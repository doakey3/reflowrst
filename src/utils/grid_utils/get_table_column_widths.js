"use babel";
import get_sum from '../get_sum.js';

import get_span_from_span_group from './get_span_from_span_group.js';
import get_span_column_count from './get_span_column_count.js';
import get_longest_line_length from './get_longest_line_length.js';

var get_table_column_widths = function(table, spans) {
    /*
    Get the widths of the columns of the table (number of characters)
    */

    var column_widths = [];
    for (var column = 0; column < table[0].length; column++) {
        column_widths.push(3);
    }

    for (var row = 0; row < table.length; row++) {
        for (var column = 0; column < table[row].length; column++) {
            var span = get_span_from_span_group(row, column, spans);
            var column_count = get_span_column_count(span);
            if (column_count == 1) {
                var text_row = span[0][0];
                var text_column = span[0][1];
                var text = table[text_row][text_column];
                var length = get_longest_line_length(text);
                if (length > column_widths[column]) {
                    column_widths[column] = length;
                }
            }
        }
    }

    for (var row = 0; row < table.length; row++) {
        for (var column = 0; column < table[row].length; column++) {
            var span = get_span_from_span_group(row, column, spans);
            var column_count = get_span_column_count(span);
            if (column_count > 1) {
                var text_row = span[0][0];
                var text_column = span[0][1];
                var text = table[text_row][text_column];
                var length = get_longest_line_length(text);
                var end_column = span[span.length - 1][1];
                var available_space = column_widths.slice(text_column, end_column + 1).reduce(get_sum) + ((column_count - 1));
                while (length > available_space) {
                    var min_col = Math.min.apply(Math, column_widths.slice(text_column, end_column + 1));
                    var index = column_widths.slice(text_column, end_column + 1).indexOf(min_col) + column_widths.slice(0, text_column).length;
                    column_widths[index] += 1;
                    available_space = column_widths.slice(text_column, end_column + 1).reduce(get_sum) + ((column_count - 1));
                }
            }
        }
    }
    return column_widths;
}

export default get_table_column_widths;
