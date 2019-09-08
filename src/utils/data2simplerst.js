"use babel";
import center_text from './center_text.js';
import space_fill from './space_fill.js';
import rstrip from './rstrip.js';
import replace_all from './replace_all.js';

import normalize_spans from './grid_utils/normalize_spans.js';
import get_table_column_widths from './grid_utils/get_table_column_widths.js';
import get_span_from_span_group from './grid_utils/get_span_from_span_group.js';
import get_span_column_count from './grid_utils/get_span_column_count.js';
import get_span_character_width from './grid_utils/get_span_character_width.js';

var data2simplerst = function(table, spans, header_row, interspace) {
    var spans = spans || [[[0, 0]]];
    var header_row = header_row || -1;
    var interspace = interspace || "  ";

    // Ensure that each cell has only a single line
    for (var row = 0; row < table.length; row++) {
        for (var column = 0; column < table[row].length; column++) {
            table[row][column] = replace_all(table[row][column], "\n", " ");
        }
    }

    spans = normalize_spans(table, spans);

    var column_widths = get_table_column_widths(table, spans);
    var border_line = "";
    for (var i = 0; i < column_widths.length; i++) {
        border_line += space_fill(column_widths[i], "=") + interspace;
    }
    border_line = rstrip(border_line);

    var centered_rows = [];
    var spanned_rows = [];
    for (var row = 0; row < table.length; row++) {
        for (var column = 0; column < table[row].length; column++) {
            var span = get_span_from_span_group(row, column, spans);
            var col_count = get_span_column_count(span);
            if (row <= header_row || col_count > 1) {
                centered_rows.push(row);
            }
            if (col_count > 1) {
                spanned_rows.push(row);
            }
        }
    }
    centered_rows = Array.from(new Set(centered_rows));

    var output = border_line + "\n";
    var row_spans = [];
    var used_spans = [];
    for (var row = 0; row < table.length; row++) {
        for (var column = 0; column < table[row].length; column++) {
            var span = get_span_from_span_group(row, column, spans);
            var check_span = get_span_from_span_group(span[0][0], span[0][1], used_spans);
            if (check_span == null) {
                row_spans.push(span);
                used_spans.push(span);
                if (centered_rows.indexOf(row) != -1) {
                    var col_count = get_span_column_count(span);
                    var char_width = get_span_character_width(span, column_widths, interspace);
                    output += center_text(table[row][column], char_width) + interspace;

                }
                else {
                    output += table[row][column] + space_fill(column_widths[column] - table[row][column].length, " ") + interspace;
                }
            }
        }
        output = rstrip(output) + "\n";
        if (spanned_rows.indexOf(row) != -1) {
            for (var i = 0; i < row_spans.length; i++) {
                var col_count = get_span_column_count(span);
                var char_width = get_span_character_width(row_spans[i], column_widths, interspace);
                output += space_fill(char_width, "-") + interspace;
            }
            output = rstrip(output) + "\n";
        }
        row_spans = [];
        if (row == header_row) {
            output += border_line + "\n";
        }
    }
    output += border_line;
    return output;
}

export default data2simplerst;
