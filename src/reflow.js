"use babel";

import rstrip from "./utils/rstrip.js";
import replace_all from "./utils/replace_all.js";
import lstrip from "./utils/lstrip.js";
import split_lines from "./utils/split_lines.js";
import begins_with from "./utils/begins_with.js";
import get_sum from "./utils/get_sum.js";
import grid2data from "./utils/grid2data.js";
import data2rst from "./utils/data2rst.js";

import normalize_spans from "./utils/grid_utils/normalize_spans.js";
import get_table_column_widths from "./utils/grid_utils/get_table_column_widths.js";
import get_span_from_span_group from "./utils/grid_utils/get_span_from_span_group.js";
import get_span_column_count from "./utils/grid_utils/get_span_column_count.js";
import get_longest_line_length from "./utils/grid_utils/get_longest_line_length.js";

import get_bullet_breakpoints from "./utils/grid_utils/breakpoints/get_bullet_breakpoints.js";
import get_paragraph_breakpoints from "./utils/grid_utils/breakpoints/get_paragraph_breakpoints.js";
import get_field_breakpoints from "./utils/grid_utils/breakpoints/get_field_breakpoints.js";


import is_bullet from "./identifiers/is_bullet.js";
import is_todo from "./identifiers/is_todo.js";
import is_enumerated from "./identifiers/is_enumerated.js";
import is_field from "./identifiers/is_field.js";
import is_grid_table from "./identifiers/is_grid_table.js";
import is_main_title from "./identifiers/is_main_title.js";
import is_title from "./identifiers/is_title.js";
import is_simple_table from "./identifiers/is_simple_table.js";
import is_definition from "./identifiers/is_definition.js";
import is_directive from "./identifiers/is_directive.js";
import is_option from "./identifiers/is_option.js";
import is_substitution_definition from "./identifiers/is_substitution_definition.js";
import is_comment from "./identifiers/is_comment.js";


import collect_bullet from "./collectors/collect_bullet.js";
import collect_enumerated from "./collectors/collect_enumerated.js";
import collect_field from "./collectors/collect_field.js";
import collect_main_title from "./collectors/collect_main_title.js";
import collect_paragraph from "./collectors/collect_paragraph.js";
import collect_simple_table from "./collectors/collect_simple_table.js";
import collect_title from "./collectors/collect_title.js";
import collect_grid_table from "./collectors/collect_grid_table.js";
import collect_definition from "./collectors/collect_definition.js";
import collect_directive from "./collectors/collect_directive.js";
import collect_option from "./collectors/collect_option.js";

import reflow_main_title from "./reflowers/reflow_main_title.js";
import reflow_bullet from "./reflowers/reflow_bullet.js";
import reflow_todo from "./reflowers/reflow_todo.js";
import reflow_enumerated from "./reflowers/reflow_enumerated.js";

import reflow_field from "./reflowers/reflow_field.js";
import reflow_paragraph from "./reflowers/reflow_paragraph.js";
import reflow_definition from "./reflowers/reflow_definition.js";
import reflow_directive from "./reflowers/reflow_directive.js";
import reflow_option from "./reflowers/reflow_option.js";


var reflow = function(text, space) {
    if (!space || space < 0) {
        space = 0;
    }

    var reflowed = [];
    text = replace_all(text, "\t", "    ");
    var lines = split_lines(text);
    var holder = [];

    var i = 0;
    while (i < lines.length) {
        if (rstrip(lines[i]) == "") {
            reflowed.push("");
            i++;
        }
        else if (is_main_title(lines, i)) {
            holder = collect_main_title(lines, i);
            reflowed.push(reflow_main_title(holder[0], space));
            i = holder[1];
        }
        else if (is_title(lines, i)) {
            holder = collect_title(lines, i);
            reflowed.push(holder[0]);
            i = holder[1];
        }
        else if (is_simple_table(lines, i)) {
            holder = collect_simple_table(lines, i);
            var data = simple2data(holder[0]);
            var simple_table = make_ideal_simple_table(data, space);
            reflowed.push(simple_table);
            i = holder[1];
        }
        else if (is_grid_table(lines, i)) {
            holder = collect_grid_table(lines, i);
            var data = grid2data(holder[0]);
            var gridtable = make_ideal_grid_table(data, space);
            reflowed.push(gridtable);
            i = holder[1];
        }

        else if (is_field(lines, i)) {
            holder = collect_field(lines, i);
            reflowed.push(reflow_field(holder[0], space));
            i = holder[1];
        }
        else if (is_bullet(lines, i)) {
            holder = collect_bullet(lines, i);
            reflowed.push(reflow_bullet(holder[0], space));
            i = holder[1];
        }
        else if (is_todo(lines, i)) {
            holder = collect_bullet(lines, i);
            reflowed.push(reflow_todo(holder[0], space));
            i = holder[1];
        }
        else if (is_enumerated(lines, i)) {
            holder = collect_enumerated(lines, i);
            reflowed.push(reflow_enumerated(holder[0], space));

            i = holder[1];
        }
        else if (is_option(lines, i)) {
            holder = collect_option(lines, i);
            reflowed.push(reflow_option(holder[0], space));
            i = holder[1];
        }
        else if (is_directive(lines, i)) {
            holder = collect_directive(lines, i);
            reflowed.push(reflow_directive(holder[0], space));
            i = holder[1];
        }
        else if (is_substitution_definition(lines, i)) {
            holder = collect_directive(lines, i);
            reflowed.push(reflow_directive(holder[0], space));
            i = holder[1];
        }
        else if (is_comment(lines, i)) {
            holder = collect_directive(lines, i);
            reflowed.push(reflow_directive(holder[0], space));
            i = holder[1];
        }
        else if (is_definition(lines, i)) {
            holder = collect_definition(lines, i);
            reflowed.push(reflow_definition(holder[0], space));
            i = holder[1];
        }
        else {
            holder = collect_paragraph(lines, i);
            reflowed.push(reflow_paragraph(holder[0], space));
            i = holder[1];
        }
    }

    var output = rstrip(reflowed.join("\n"));
    return output;
}

var make_ideal_simple_table = function(data, space) {
    var table = data["table"];
    var spans = data["spans"];
    var header_row = data["header_row"];
    var leading_space = data["leading_space"];
    var space = space - leading_space.length;

    var simple_table = data2simplerst(table, spans, header_row);
    var lines = split_lines(simple_table);
    for (var i = 0; i < lines.length; i++) {
        lines[i] = leading_space + lines[i];
    }
    return lines.join('\n');
}

var range = function(startAt, endAt) {
    var startAt = startAt || 0;
    var endAt = endAt || 0;

    var range = [];
    for (var i = startAt; i < endAt + 1; i++) {
        range.push(i);
    }
    return range;
}

var cartesian_product = function(arr) {
    return arr.reduce(function(a,b) {
        return a.map(function(x) {
            return b.map(function(y) {
                return x.concat(y);
            })
        }).reduce(function(a,b) { return a.concat(b) },[])
    }, [[]])
}

var get_text_breakpoints = function(text) {
    var text = reflow(text, 0);
    var lines = split_lines(text);

    var breakpoints = [];
    var holder = [];

    var i = 0;
    while (i < lines.length) {
        if (rstrip(lines[i]) == "") {
            i++;
        }
        else if (is_field(lines, i)) {
            holder = collect_field(lines, i);
            breakpoints = breakpoints.concat(get_field_breakpoints(holder[0]));
            i = holder[1];
        }
        else if (is_bullet(lines, i)) {
            holder = collect_bullet(lines, i);
            breakpoints = breakpoints.concat(get_bullet_breakpoints(holder[0]));
            i = holder[1];
        }
        else {
            holder = collect_paragraph(lines, i);
            breakpoints = breakpoints.concat(get_paragraph_breakpoints(holder[0]));
            i = holder[1];
        }
    }

    breakpoints = Array.from(new Set(breakpoints)).sort(function(a, b) {
        if (a < b) return -1;
        if (a > b) return 1;
    });
    return breakpoints;
}

var make_breakpoint_table = function(table, spans, breakpoint_combo) {
    var temp_table = [];
    for (var row = 0; row < table.length; row++) {
        temp_table.push([]);
        for (var column = 0; column < table[row].length; column++) {
            var span = get_span_from_span_group(row, column, spans);
            var col_count = get_span_column_count(span);
            if (col_count > 1 && span[0][0] == row && span[0][1] == column) {
                var start_column = span[0][1];
                var end_column = span[span.length - 1][1];
                var cell_space = breakpoint_combo.slice(start_column, end_column + 1).reduce(get_sum) + ((col_count - 1) * 3);
            }
            else {
                cell_space = breakpoint_combo[column];
            }
            var cell_text = table[row][column];
            temp_table[row].push(reflow(cell_text, cell_space));
        }
    }
    return temp_table;
}

var calculate_grid_ugliness = function(table, spans, pretty_table, breakpoint_combo) {
    var ugly_table = make_breakpoint_table(table, spans, breakpoint_combo);

    var cell_scores = [];
    for (var row = 0; row < table.length; row++) {
        for (var column = 0; column < table[row].length; column++) {
            var pretty_line_count = pretty_table[row][column].split('\n').length;
            var ugly_line_count = ugly_table[row][column].split('\n').length;
            cell_scores.push((ugly_line_count / pretty_line_count) - 1)
        }
    }
    return cell_scores.reduce(get_sum);
}

var make_ideal_grid_table = function(data, space) {
    /*
    To reflow a grid table, I need to know the width of the columns of the new
    table. This function attempts to calculate a set of widths that will produce
    a grid table of minimum height and the maximum width within the allowed
    space at that height.
    */

    var table = data["table"];

    var spans = data["spans"];
    var use_headers = data["use_headers"];

    var leading_space = data["leading_space"];
    var space = space - leading_space.length;

    var spans = normalize_spans(table, spans);
    var column_count = table[0].length;

    // The actual room for characters in a table is less than the given space
    // because of the border + padding within the grid table.
    var text_space = space - ((column_count + 1) + (2 * column_count));

    var wide_table = [];
    var narrow_table = [];
    var pretty_table = [];
    for (var row = 0; row < table.length; row++) {
        wide_table.push([]);
        narrow_table.push([]);
        pretty_table.push([]);
        for (var column = 0; column < table[row].length; column++) {
            wide_table[row][column] = reflow(table[row][column], 0);
            narrow_table[row][column] = reflow(table[row][column], 1);
            pretty_table[row][column] = reflow(table[row][column], space - 4);
        }
    }

    var tallest_grid = data2rst(narrow_table, spans, use_headers);
    var widest_grid = data2rst(wide_table, spans, use_headers);

    var max_column_widths = get_table_column_widths(wide_table, spans);
    var min_column_widths = get_table_column_widths(narrow_table, spans);

    if (max_column_widths.reduce(get_sum) <= text_space + (2 * max_column_widths.length) || space == 0) {
        var grid = widest_grid;
    }

    else if (min_column_widths.reduce(get_sum) > text_space + (2 * min_column_widths.length)) {
        var grid = tallest_grid;
    }

    else {
        var per_cell_breakpoints = [];
        for (var row = 0; row < table.length; row++) {
            per_cell_breakpoints.push([]);
            for (var column = 0; column < table[row].length; column++) {
                var span = get_span_from_span_group(row, column, spans);
                var col_count = get_span_column_count(span);
                if (col_count == 1) {
                    per_cell_breakpoints[row].push(get_text_breakpoints(table[row][column]));
                }
                else {
                    per_cell_breakpoints[row].push([]);
                }
            }
        }
        var column_breakpoints = [];
        for (var column = 0; column < table[0].length; column++) {
            column_breakpoints.push([]);
        }

        for (var row = 0; row < per_cell_breakpoints.length; row++) {
            for (var column = 0; column < per_cell_breakpoints[row].length; column++) {
                column_breakpoints[column] = column_breakpoints[column].concat(per_cell_breakpoints[row][column]);

            }
        }

        for (var column = 0; column < column_breakpoints.length; column++) {
            column_breakpoints[column] = Array.from(new Set(column_breakpoints[column])).sort(function(a, b) {
                if (a < b) return -1;
                if (a > b) return 1;
            });
        }

        for (var column = 0; column < column_breakpoints.length; column++) {
            column_breakpoints[column] = column_breakpoints[column].filter(function(x) {
                return x >= min_column_widths[column] - 2;
            });
        }

        var breakpoint_combos = cartesian_product(column_breakpoints);

        var column_spanning_spans = [];
        for (var row = 0; row < table.length; row++) {
            for (var column = 0; column < table[row].length; column++) {
                var span = get_span_from_span_group(row, column, spans);
                var col_count = get_span_column_count(span);
                if (col_count > 1 && span[0][0] == row && span[0][1] == column) {
                    column_spanning_spans.push(span);
                }
            }
        }

        for (var i = 0; i < column_spanning_spans.length; i++) {
            var span = column_spanning_spans[i];
            var col_count = get_span_column_count(span);
            var text_row = span[0][0];
            var text_column = span[0][1];
            var span_text = table[text_row][text_column];
            var minimum_span_width = get_longest_line_length(reflow(span_text, 1)) - ((col_count - 1) * 3);
            var end_column = span[span.length - 1][1];

            for (var x = 0; x < breakpoint_combos.length; x++) {
                while (breakpoint_combos[x].slice(text_column, end_column + 1).reduce(get_sum) < minimum_span_width) {
                    var min_col = Math.min.apply(Math, breakpoint_combos[x].slice(text_column, end_column + 1));
                    var index = breakpoint_combos[x].slice(text_column, end_column + 1).indexOf(min_col) + breakpoint_combos[x].slice(0, text_column).length;
                    breakpoint_combos[x][index] += 1;
                }
            }
        }

        i = 0;
        while (i < breakpoint_combos.length) {
            if (breakpoint_combos[i].reduce(get_sum) > text_space || breakpoint_combos[i].reduce(get_sum) + (2 * min_column_widths.length) <= min_column_widths.reduce(get_sum)) {
                breakpoint_combos.splice(i, 1);
            }
            else {
                i += 1;
            }
        }

        if (breakpoint_combos.length == 0) {
            return tallest_grid;
        }

        /*
        Limit the number of breakpoint_combos to evaluate so your algorithm
        doesn't take forever for complex grids.
        */
        var limit = 10000;
        /*
        Shuffle the combos so that if we reach the limit, there is an increased
        variability among the combos actually tested and a higher chance that
        an ideal combo will be located.
        */
        if (breakpoint_combos.length > limit) {
            shuffle(breakpoint_combos);
        }

        var most_ugly = calculate_grid_ugliness(table, spans, pretty_table, min_column_widths);
        var ugly_score_widths = {most_ugly: min_column_widths};
        var least_ugly = most_ugly;
        for (var i = 0; i < breakpoint_combos.length && i < limit; i++) {
            var ugly_score = calculate_grid_ugliness(table, spans, pretty_table, breakpoint_combos[i]);
            if (ugly_score < least_ugly) {
                least_ugly = ugly_score;
            }
            ugly_score_widths[ugly_score] = breakpoint_combos[i];
        }

        var output_table = make_breakpoint_table(table, spans, ugly_score_widths[least_ugly]);
        var grid = data2rst(output_table, spans, use_headers);
    }

    if (leading_space.length > 0) {
        var grid_lines = grid.split('\n');
        for (var i = 0; i < grid_lines.length; i++) {
            grid_lines[i] = leading_space + grid_lines[i];
        }
        grid = grid_lines.join('\n');
    }
    return grid;
}

export default reflow;


