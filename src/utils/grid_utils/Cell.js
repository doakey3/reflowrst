"use babel";
import is_only from '../is_only.js';
import rstrip from '../rstrip.js';
import space_fill from '../space_fill.js';
import replace_all from '../replace_all.js';

import get_longest_line_length from './get_longest_line_length.js';

var Cell = function(text, row, column, row_count, column_count) {
    this.text = text;
    this.row = row;
    this.column = column;
    this.row_count = row_count;
    this.column_count = column_count;

    this.get_left_sections = function() {
        var lines = this.text.split('\n');
        var sections = 0;
        for (var i = 0; i < lines.length; i++) {
            if (lines[i][0] == "+") {
                sections += 1;
            }
        }
        return sections - 1;
    }

    this.get_right_sections = function() {
        var lines = this.text.split('\n');
        var sections = 0;
        for (var i = 0; i < lines.length; i++) {
            if (lines[i][lines[i].length - 1] == "+") {
                sections += 1;
            }
        }
        return sections - 1;
    }

    this.get_top_sections = function() {
        var top_line = this.text.split('\n')[0];
        return top_line.split("+").length - 2;
    }

    this.get_bottom_sections = function() {
        var lines = this.text.split('\n');
        var bottom_line = lines[lines.length - 1];
        return bottom_line.split("+").length - 2;
    }

    this.is_header = function() {
        var lines = this.text.split('\n');
        var bottom_line = lines[lines.length - 1];
        return is_only(bottom_line, ["+", "="]);
    }

    this.h_center_cell = function() {
        var lines = this.text.split('\n');
        var cell_width = lines[0].length - 2;

        var truncated_lines = [];
        for (var i = 1; i < lines.length - 1; i++) {
            var truncated = rstrip(lines[i].slice(2, lines[i].length - 2));
            truncated_lines.push(truncated);
        }

        truncated_lines.push('');
        truncated_lines.splice(0, 0, "");

        var max_line_length = get_longest_line_length(truncated_lines.join('\n'));
        var remainder = cell_width - max_line_length;
        var left_width = Math.floor(remainder / 2);
        var left_space = space_fill(left_width, " ");

        for (var i = 0; i < truncated_lines.length; i++) {
            truncated_lines[i] = left_space + truncated_lines[i];
            var right_width = cell_width - truncated_lines[i].length;
            truncated_lines[i] += space_fill(right_width, " ");
        }

        for (var i = 1; i < lines.length - 1; i++) {
            lines[i] = lines[i][0] + truncated_lines[i] + lines[i][lines[i].length - 1];
        }

        this.text = lines.join('\n');
    }

    this.v_center_cell = function() {
        var lines = this.text.split('\n');
        var cell_width = lines[0].length - 2;

        var truncated_lines = [];
        for (var i = 1; i < lines.length - 1; i++) {
            var truncated = lines[i].slice(1, lines[i].length - 1);
            truncated_lines.push(truncated);
        }

        var total_height = truncated_lines.length;
        var above_trash_count = 0;
        for (var i = 0; i < truncated_lines.length; i++) {
            if (rstrip(truncated_lines[i]) == "") {
                above_trash_count += 1;
            }
            else {
                break;
            }
        }

        var below_trash_count = 0;
        for (var i = truncated_lines.length - 1; i > 0; i--) {
            if (rstrip(truncated_lines[i]) == "") {
                below_trash_count += 1;
            }
            else {
                break;
            }
        }

        var significant_lines = truncated_lines.slice(above_trash_count, truncated_lines.length - below_trash_count);

        var remainder = total_height - significant_lines.length;
        var blank = space_fill(cell_width, " ");
        var above_height = Math.floor(remainder / 2);
        for (var i = 0; i < above_height; i++) {
            significant_lines.splice(0, 0, blank);
        }

        var below_height = Math.ceil(remainder / 2);
        for (var i = 0; i < below_height; i++) {
            significant_lines.push(blank);
        }

        significant_lines.splice(0, 0, "");
        significant_lines.push("");

        for (var i = 1; i < lines.length - 1; i++) {
            lines[i] = lines[i][0] + significant_lines[i] + lines[i][lines[i].length - 1];
        }

        this.text = lines.join('\n');
    }

    this.mergeableDirection = function(other) {
        var self_left = this.column;
        var self_right = this.column + this.column_count;
        var self_top = this.row;
        var self_bottom = this.row + this.row_count;

        var other_left = other.column;
        var other_right = other.column + other.column_count;
        var other_top = other.row;
        var other_bottom = other.row + other.row_count;

        if (self_right == other_left && self_top == other_top && self_bottom == other_bottom && this.get_right_sections() >= other.get_left_sections()) {return "RIGHT"}
        else if (self_left == other_left && self_right == other_right && self_top == other_bottom && this.get_top_sections() >= other.get_bottom_sections()) {return "TOP"}
        else if (self_left == other_left && self_right == other_right && self_bottom == other_top && this.get_bottom_sections() >= other.get_top_sections()) {return "BOTTOM"}
        else if (self_left == other_right && self_top == other_top && self_bottom == other_bottom && this.get_left_sections() >= other.get_right_sections()) {return "LEFT"}
        else {return "NONE"}
    }

    this.merge = function(other) {
        var self_lines = this.text.split('\n');
        var other_lines = other.text.split('\n');

        if (this.mergeableDirection(other) == "RIGHT") {
            for (var i = 0; i < self_lines.length; i++) {
                self_lines[i] = self_lines[i] + other_lines[i].substring(1);
            }
            this.text = self_lines.join('\n');
            this.column_count += other.column_count;
            return true;
        }

        else if (this.mergeableDirection(other) == "TOP") {
            if ((self_lines[0].match(/\+/g) || []).length > (other_lines[other_lines.length - 1].match(/\+/g) || []).length) {
                other_lines.pop();
            }
            else {
                self_lines = self_lines.slice(1);
            }
            other_lines = other_lines.concat(self_lines);
            this.text = other_lines.join('\n');
            this.row_count += other.row_count;
            this.row = other.row;
            this.column = other.column;
            return true;
        }

        else if (this.mergeableDirection(other) == "BOTTOM") {
            if ((self_lines[self_lines.length - 1].match(/\+/g) || []).length > (other_lines[other_lines.length - 1].match(/\+/g) || []).length) {
                other_lines.splice(0, 1);
            }
            else {
                self_lines.pop();
                if (this.is_header()) {
                    other_lines[0] = replace_all(other_lines[0], "-", "=");
                }
            }
            self_lines = self_lines.concat(other_lines);
            this.text = self_lines.join('\n');
            this.row_count += other.row_count;
            return true;
        }

        else if (this.mergeableDirection(other) == "LEFT") {
            for (var i = 0; i < self_lines.length; i++) {
                self_lines[i] = other_lines[i].substring(0, other_lines[i].length - 1) + self_lines[i];
            }
            this.text = self_lines.join('\n');
            this.column_count += other.column_count;
            this.row = other.row;
            this.column = other.column;
            return true;
        }
        else {
            return false;
        }
    }

    if (this.is_header()) {
        this.h_center_cell();
        this.v_center_cell();
    }

    else if (this.row_count > 1) {
        this.v_center_cell();
    }

    return this;
}

export default Cell;
