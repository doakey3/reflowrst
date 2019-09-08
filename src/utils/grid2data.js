"use babel";
import strip from './strip.js';
import rstrip from './rstrip.js';
import lstrip from './lstrip.js';
import split_lines from './split_lines.js';
import truncate_lines from './truncate_lines.js';
import is_only from './is_only.js';
import pair_in_array from './grid_utils/pair_in_array.js';
import generate_empty_table from './grid_utils/generate_empty_table.js';

var analyze_border = function(lines, line_index, char_index, args) {
    /*
    Recursively traces along the grid's borders, returning the positions of
    all '+' border characters in [line_row, character_index] pairs.
    */

    var args = args || {};

    var default_args = {
        // keep track of [line_index, char_index] pairs that have been examined
        "used_pairs": [],
        // keep track of [line_index, char_index] pairs of '+' symbol locations
        "border_map": [],
        // the direction to analyze for this recursion
        "direction": "RIGHT"
    };

    var keys = Object.keys(args);
    for (var i = 0; i < keys.length; i++) {
        default_args[keys[i]] = args[keys[i]];
    }

    args = default_args;
    var found = [];

    if (args["direction"] == "RIGHT") {
        for (var c = char_index + 1; c < lines[line_index].length; c++) {
            args["used_pairs"].push([line_index, c]);
            if (lines[line_index][c] == "+") {
                found = [line_index, c];
                break;
            }
        }
    }

    else if (args["direction"] == "LEFT") {
        for (var c = char_index - 1; c > -1; c--) {
            args["used_pairs"].push([line_index, c]);
            if (lines[line_index][c] == "+") {
                found = [line_index, c];
                break;
            }
        }
    }

    else if (args["direction"] == "UP") {
        for (var i = line_index - 1; i > -1; i--) {
            args["used_pairs"].push([i, char_index]);
            if (lines[i][char_index] == "+") {
                found = [i, char_index];
                break;
            }
        }
    }

    else if (args["direction"] == "DOWN") {
        for (var i = line_index + 1; i < lines.length; i++) {
            args["used_pairs"].push([i, char_index]);
            if (lines[i][char_index] == "+") {
                found = [i, char_index];
                break;
            }
        }
    }

    if (!pair_in_array(found, args["border_map"])) {
        args["border_map"].push(found);
    }

    var breaks = ['-', '='];
    // Should I check RIGHT next?
    if (found[1] < lines[found[0]].length - 1 &&
        breaks.indexOf(lines[found[0]][found[1] + 1]) != -1 &&
        !pair_in_array([found[0], found[1] + 1], args["used_pairs"])) {

        args["direction"] = "RIGHT";
        args = analyze_border(lines, found[0], found[1], args);
    }
    // Should I check LEFT next?
    if (found[1] > 0 &&
        breaks.indexOf(lines[found[0]][found[1] - 1]) != -1 &&
        !pair_in_array([found[0], found[1] - 1], args["used_pairs"])) {

        args["direction"] = "LEFT";
        args = analyze_border(lines, found[0], found[1], args);
    }

    // Should I check UP next?
    if (found[0] > 0 &&
        lines[found[0] - 1][found[1]] == "|" &&
        !pair_in_array([found[0] - 1, found[1]], args["used_pairs"])) {

        args["direction"] = "UP";
        args = analyze_border(lines, found[0], found[1], args);
    }

    // Should I check DOWN next?
    if (found[0] < lines.length - 1 &&
        lines[found[0] + 1][found[1]] == "|" &&
        !pair_in_array([found[0] + 1, found[1]], args["used_pairs"])) {

        args["direction"] = "DOWN";
        args = analyze_border(lines, found[0], found[1], args);
    }

    return args;
}

var is_border_corner = function(lines, line_index, char_index) {
    "If I've found a '+' character, is it a cell corner?"

    if (lines[line_index][char_index] != "+") {
        return false;
    }

    var breaks = ['-', '='];

    if (char_index = lines[line_index].length - 1) {
        return true;
    }

    else if (char_index > lines[line_index].length - 4) {
        return false;
    }

    else if (breaks.indexOf(lines[line_index][char_index + 1]) != -1 && breaks.indexOf(lines[line_index][char_index + 2]) != -1) {
        if (line_index == lines.length - 1 && lines[line_index - 1][char_index] == '|') {
            return true;
        }
        else if (line_index == 0 && lines[line_index + 1][char_index] == '|') {
            return true;
        }
        else if (lines[line_index - 1][char_index] == '|' && lines[line_index + 1][char_index] == '|') {
            return true;
        }
        else {
            return false;
        }
    }

    return false;
}

var get_top_lefts = function(lines, border_map) {
    /*
    Get a list of the [line_index, char_index] pairs that represent a top-left
    corner.
    */
    var top_lefts = [];
    var breaks = ['-', '='];
    for (var i = 0; i < border_map.length; i++) {
        if (border_map[i][0] < lines.length - 1 &&
            border_map[i][1] < lines[border_map[i][0]].length - 1 &&
            breaks.indexOf(lines[border_map[i][0]][border_map[i][1] + 1]) != -1 &&
            lines[border_map[i][0] + 1][border_map[i][1]] == "|") {

            top_lefts.push(border_map[i]);
        }
    }

    return top_lefts;
}

var get_cell_bottom_right = function(lines, top_left) {
    /*
    Get the bottom right corner location of a cell
    */
    var right = top_left[1];
    for (var c = top_left[1] + 1; c < lines[top_left[0]].length; c++) {
        if (lines[top_left[0]][c] == "+" && lines[top_left[0] + 1][c] == "|") {
            right = c;
            break;
        }
    }
    var breaks = ["-", "="];
    var bottom = top_left[0];
    for (var r = top_left[0] + 1; r < lines.length; r++) {
        if (lines[r][right] == "+" && breaks.indexOf(lines[r][right - 1]) != -1) {
            bottom = r;
            break;
        }
    }

    return [bottom, right];
}

var get_cell_table_position = function(top_left, border_map) {
    /*
    Get a cell's position in the table as a [row, column] pair
    */

    var levels = get_levels(border_map);
    var vert_levels = levels[0];
    var hor_levels = levels[1];

    var row = vert_levels.indexOf(top_left[0]);
    var column = hor_levels.indexOf(top_left[1]);
    return [row, column];
}

var get_cell_content = function(lines, top_left) {
    /*
    Remove the border text around the cell and get the text content
    */
    var bottom_right = get_cell_bottom_right(lines, top_left);
    var cell_lines = [];
    for (var r = top_left[0] + 1; r < bottom_right[0]; r++) {
        cell_lines.push(rstrip(lines[r].substring(top_left[1] + 1, bottom_right[1] - 1)));
    }

    cell_lines = split_lines(truncate_lines(cell_lines.join('\n')));

    var leading_space = lines[0];
    for (var i = 0; i < cell_lines.length; i++) {
        if (rstrip(cell_lines[i]) != "") {
            var this_leading_space = cell_lines[i].replace(lstrip(cell_lines[i]), "");
            if (this_leading_space.length < leading_space.length) {
                leading_space = this_leading_space;
            }
        }
    }

    for (var i = 0; i < cell_lines.length; i++) {
        cell_lines[i] = cell_lines[i].substring(leading_space.length);
    }
    return rstrip(cell_lines.join('\n'));
}

var get_cell_span = function(lines, border_map, top_left) {
    /*
    Tell me what rows, columns a cell spans if it spans multiple rows/columns
    returns a list of [row, column] pairs
    */

    var pos = get_cell_table_position(top_left, border_map);
    var levels = get_levels(border_map);
    var vert_levels = levels[0];
    var hor_levels = levels[1];

    var bottom_right = get_cell_bottom_right(lines, top_left);

    var start_row = 0;
    for (var i = 0; i < vert_levels.length; i++) {
        if (top_left[0] == vert_levels[i]) {
            start_row = i;
            break;
        }
    }

    var end_row = 0;
    for (var i = 0; i < vert_levels.length; i++) {
        if (bottom_right[0] == vert_levels[i]) {
            end_row = i;
            break;
        }
    }

    var start_column = 0;
    for (var i = 0; i < hor_levels.length; i++) {
        if (top_left[1] == hor_levels[i]) {
            start_column = i;
            break;
        }
    }

    var end_column = 0;
    for (var i = 0; i < hor_levels.length; i++) {
        if (bottom_right[1] == hor_levels[i]) {
            end_column = i;
            break;
        }
    }

    var spans = [];
    var r_diff = end_row - start_row;
    var c_diff = end_column - start_column;

    for (var r = 0; r < r_diff; r++) {
        for (var c = 0; c < c_diff; c++) {
            spans.push([pos[0] + r, pos[1] + c]);
        }
    }
    return spans;
}

var is_headered = function(lines) {
    /*
    Check if the grid table uses headers
    */
    for (var i = 0; i < lines.length; i++) {
        if (is_only(strip(lines[i]), ["+", "="])) {
            return true;
        }
    }

    return false;
}

var get_levels = function(border_map) {
    var vert_levels = [];
    var hor_levels = [];
    for (var i = 0; i < border_map.length; i++) {
        if (vert_levels.indexOf(border_map[i][0]) == -1) {
            vert_levels.push(border_map[i][0]);
        }
        if (hor_levels.indexOf(border_map[i][1]) == -1) {
            hor_levels.push(border_map[i][1]);
        }
    }
    vert_levels.sort(function(a, b) {
        if (a < b) return -1;
        if (a > b) return 1;
    });
    hor_levels.sort(function(a, b) {
        if (a < b) return -1;
        if (a > b) return 1;
    });

    return [vert_levels, hor_levels];
}

var grid2data = function(text) {
    /*
    Parse the grid table and return an array of arrays of strings with cell
    content, an array of arrays representing cell spans, and a true/false value
    indicating whether or not the grid table has a header row.
    */
    if (strip(text) == "" || strip(text)[0] != "+") {
        return {"table": [[""]], "spans": [[[0, 0]]], "use_headers": false, "leading_space": ""};
    }

    var lines = split_lines(text);
    var leading_space = lines[0].replace(lstrip(lines[0]), '');
    for (var i = 0; i < lines.length; i++) {
        lines[i] = lines[i].substr(leading_space.length);
    }

    var border_map = analyze_border(lines, 0, 0)["border_map"].sort(function(a, b) {
        if (a[0] < b[0]) return -1;
        if (a[0] > b[0]) return 1;
        if (a[0] == b[0] && a[1] < b[1]) return -1;
        if (a[0] == b[0] && a[1] > b[1]) return 1;
    });

    var levels = get_levels(border_map);
    var vert_levels = levels[0];
    var hor_levels = levels[1];

    var row_count = vert_levels.length - 1;
    var column_count = hor_levels.length - 1;
    var table = generate_empty_table(row_count, column_count);

    var top_lefts = get_top_lefts(lines, border_map);

    for (var i = 0; i < top_lefts.length; i++) {
        var pos = get_cell_table_position(top_lefts[i], border_map);
        table[pos[0]][pos[1]] = get_cell_content(lines, top_lefts[i]);
    }

    var spans = [];
    for (var i = 0; i < top_lefts.length; i++) {
        var span = get_cell_span(lines, border_map, top_lefts[i]);
        if (span.length > 1) {
            spans.push(span);
        }
    }

    var output = {
        "table": table,
        "spans": spans,
        "use_headers": is_headered(lines),
        "leading_space": leading_space,
    };

    return output;
}

export default grid2data;
