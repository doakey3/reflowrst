"use babel";
import rstrip from './rstrip.js';
import split_lines from './split_lines.js';
import get_sum from './get_sum.js';
import space_fill from './space_fill.js';
import is_only from './is_only.js';
import replace_all from './replace_all.js';

import normalize_spans from './grid_utils/normalize_spans.js';
import get_table_column_widths from './grid_utils/get_table_column_widths.js';
import get_table_row_heights from './grid_utils/get_table_row_heights.js';

import get_span_character_width from './grid_utils/get_span_character_width.js';
import get_span_line_count from './grid_utils/get_span_line_count.js';
import get_span_row_count from './grid_utils/get_span_row_count.js';
import get_span_column_count from './grid_utils/get_span_column_count.js';
import Cell from './grid_utils/Cell.js';

var add_cushions = function(table) {
    /*
    Adds space to the start and end of each item in a list of lists
    */
    for (var row = 0; row < table.length; row++) {
        for (var column = 0; column < table[row].length; column++) {
            var lines = table[row][column].split('\n');
            for (var i = 0; i < lines.length; i++) {
                if (lines[i] != "") {
                    lines[i] = " " + rstrip(lines[i]) + " ";
                }
                table[row][column] = lines.join("\n");
            }
        }
    }
    return table;
}

var merge_cells = function(cells) {
    /*
    Loop through list of cells and piece them together one by one
    */
    var current = 0;
    while (cells.length > 1) {
        var count = 0;
        while (count < cells.length) {
            if (cells[current].merge(cells[count]) == true) {
                if (current > count) {
                    current -= 1;
                }
                cells.splice(count, 1);
            }
            else {
                count += 1;
            }
        }
        current += 1;
        if (current >= cells.length) {
            current = 0;
        }
    }
    return cells[0].text;
}

var make_text_cell = function(table, span, column_widths, row_heights, use_headers) {
    var character_width = get_span_character_width(span, column_widths);
    var line_count = get_span_line_count(span, row_heights);

    // A span may cover multiple rows and columns, for programming purposes,
    // the text is stored in the top left [row, column] pair.
    var text_row = span[0][0];
    var text_column = span[0][1];
    var text = table[text_row][text_column];

    var lines = text.split('\n');
    for (var i = 0; i < lines.length; i++) {
        var width_difference = character_width - lines[i].length;
        lines[i] = lines[i] + space_fill(width_difference, " ");
    }

    // some lines in the span may be empty
    var height_difference = line_count - lines.length;
    var empty_lines = [];
    for (var i = 0; i < height_difference; i++) {
        empty_lines.push(space_fill(character_width, " "));
    }
    lines = lines.concat(empty_lines);

    var output = ["+" + space_fill(character_width, "-") + "+"];
    for (var i = 0; i < line_count; i++) {
        output.push("|" + lines[i] + "|")
    }

    if (use_headers == true && span[0][0] == 0) {
        var symbol = "=";
    }
    else {
        var symbol = "-";
    }

    output.push("+" + space_fill(character_width, symbol) + "+");
    text = output.join("\n");
    var row_count = get_span_row_count(span);
    var column_count = get_span_column_count(span);
    var cell = new Cell(text, text_row, text_column, row_count, column_count);

    return cell;
}

var data2rst = function(table, spans, use_headers) {
    /*
    Converts an array of arrays of string to a restructuredText grid table
    */
    var use_headers = use_headers || false;
    var spans = spans || [[[0, 0]]];

    var table = add_cushions(table);
    spans = normalize_spans(table, spans);


    var column_widths = get_table_column_widths(table, spans);
    var row_heights = get_table_row_heights(table, spans);

    var cells = [];
    for (var i = 0; i < spans.length; i++) {
        var cell = make_text_cell(table, spans[i], column_widths, row_heights, use_headers);
        cells.push(cell);
    }

    cells = cells.sort(function(a, b) {
        if ([a.row, a.column] < [b.row, b.column]) {return -1};
        if ([a.row, a.column] > [b.row, b.column]) {return 1};
    });

    var output = merge_cells(cells);
    return output;
}

export default data2rst;
