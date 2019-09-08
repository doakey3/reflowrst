"use babel";
import is_only from './is_only.js';
import space_fill from './space_fill.js';
import split_lines from './split_lines.js';
import lstrip from './lstrip.js';
import rstrip from './rstrip.js';
import strip from './strip.js';
import generate_empty_table from './grid_utils/generate_empty_table.js';

var get_inter_column_space = function(line) {
    /*
    Determine the space count between islands in a line (assumes they are all
    the same distance). For example, the line:

    ===  ===  ====

    has an interspace of "  "
    */
    var inter_split = line.split(" ");
    var inter_length = 0;
    for (var i = 1; i < inter_split.length; i++) {
        if (lstrip(inter_split[i]) != "") {
            break;
        }
        else {
            inter_length += 1;
        }
    }
    var inter_column_space = space_fill(inter_length + 1, " ");
    return inter_column_space;
};

var get_column_widths = function(line) {
    /*
    Given a line, get the widths of each island in the line. For example, the
    line:

    ===  ===  ====

    has column widths of 3, 3, 4
    */
    var inter_column_space = get_inter_column_space(line);
    var column_split = line.split(inter_column_space);
    var column_widths = [];
    for (var i = 0; i < column_split.length; i++) {
        column_widths.push(column_split[i].length);
    }
    return column_widths;
};

var get_column_bounds = function(line) {
    /*
    Gets the character index pairs of where islands begin and end for a line.
    For example, the line:

    ===  ===  ====

    has the following indices: [0, 2], [5, 7], [10, 13]
    */
    var boundaries = [];
    var temp_line = "";
    var inter_column_space = get_inter_column_space(line);
    var column_widths = get_column_widths(line, inter_column_space);

    for (var i = 0; i < column_widths.length; i++) {
        var pair = [];
        pair.push(temp_line.length);
        temp_line += space_fill(column_widths[i], "-") + inter_column_space;

        pair.push(rstrip(temp_line).length - 1);
        boundaries.push(pair);
    }
    return boundaries;
};

var is_column_span_marker = function(line, column_widths, inter_column_space) {
    /*
    Column spans are marked by lines made up of only "-" symbols, and the
    segments of this line need to start and end in line with the column markers
    at the beginning and end of the table.
    */
    if (is_only(line, ["-", " "])) {
        var boundaries = [].concat.apply([], get_column_bounds(line));
        for (var char = 0; char < line.length; char++) {
            if (line[char] == "-") {
                if (char == 0 || char == line.length - 1 || line[char - 1] == " " || line[char + 1] == " ") {
                    if (boundaries.indexOf(char) == -1) {
                        return false;
                    }
                }
            }
        }
        return true
    }
    return false;
};

var get_row_count_and_header_row = function(lines) {
    var inter_column_space = get_inter_column_space(lines[0]);
    var column_widths = get_column_widths(lines[0]);

    var row_count = 0;
    var header_row = -1;

    for (var i = 1; i < lines.length - 1; i++) {
        if (lines[i] != lines[0] && !is_column_span_marker(lines[i], column_widths, inter_column_space)) {
            row_count += 1;
        }
        else if (lines[i] == lines[0]) {
            header_row = row_count - 1;
        }
    }
    return [row_count, header_row];
};

var get_span_from_boundary = function(column_marker_line, span_boundary, row) {
    var column_boundaries = get_column_bounds(column_marker_line);

    var columns = [];
    for (var i = 0; i < column_boundaries.length; i++) {
        if (span_boundary[0] == column_boundaries[i][0]) {
            columns.push(i);
        }
        if (span_boundary[1] == column_boundaries[i][1]) {
            columns.push(i);
            break;
        }
    }
    columns = Array.from(new Set(columns)).sort(function(a, b) {
        if (a < b) return -1;
        if (a > b) return 1;
    });

    var span = [];
    for (var c = 0; c < columns.length; c++) {
        span.push([row, columns[c]]);
    }
    return span;
};

var simple2data = function(text) {
    var data = {};

    var lines = split_lines(text);
    var leading_space = lines[0].replace(lstrip(lines[0]), '');
    for (var i = 0; i < lines.length; i++) {
        lines[i] = lines[i].substr(leading_space.length);
    }

    var inter_column_space = get_inter_column_space(lines[0]);
    var column_widths = get_column_widths(lines[0]);
    var column_boundaries = get_column_bounds(lines[0]);
    var arr = get_row_count_and_header_row(lines);
    var row_count = arr[0];
    var header_row = arr[1];
    var table = generate_empty_table(row_count, column_widths.length);

    var spans = [];
    var row = 0;
    for (var i = 1; i < lines.length - 1; i++) {
        if (lines[i] != lines[0] && !is_column_span_marker(lines[i], column_widths, inter_column_space)) {
            if (is_column_span_marker(lines[i + 1], column_widths, inter_column_space)) {
                var span_boundaries = get_column_bounds(lines[i + 1]);
                for (var x = 0; x < span_boundaries.length; x++) {
                    var span = get_span_from_boundary(lines[0], span_boundaries[x], row);
                    var text_column = span[0][1];
                    var cell_text = strip(lines[i].slice(span_boundaries[x][0], span_boundaries[x][1] + 1));
                    table[row][text_column] = cell_text;
                    spans.push(span);
                }
            }
            else {
                for (var x = 0; x < column_boundaries.length; x++) {
                    if (x == column_boundaries.length - 1) {
                        var cell_text = strip(lines[i].slice(column_boundaries[x][0], lines[i].length));
                    }
                    else {
                        var cell_text = strip(lines[i].slice(column_boundaries[x][0], column_boundaries[x][1] + 1));
                    }
                    table[row][x] = cell_text;
                }
            }
            row += 1;
        }
    }

    var output = {
        "table": table,
        "spans": spans,
        "header_row": header_row,
        "leading_space": leading_space
    };

    return output;
}

export default simple2data;
