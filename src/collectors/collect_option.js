"use babel";

import is_option from "../identifiers/is_option.js";

import rstrip from "../utils/rstrip.js";
import lstrip from "../utils/lstrip.js";
import space_fill from "../utils/space_fill.js";
import begins_with from "../utils/begins_with.js";
import regex_matches from "../utils/regex_matches.js";

var get_option_betwixt = function(lines, i) {
    /*
    Gets the space that should be between the field name and the field
    text::

    --input=file    long options can also have
                    arguments

                ^^^^
          (betwixt space)
    */
    var option_name = lstrip(lines[i].match(regex_matches["option"])[0]);

    var start = i;
    while (start > 0) {
        if (rstrip(lines[start]) == "") {
            break
        }
        start -= 1;
    }

    while (start < lines.length) {
        if (is_option(lines, start)) {
            break
        }
        start += 1;
    }

    var max_option_name_length = 0;
    var x = start;
    while (x < lines.length) {
        if (rstrip(lines[x]) == "") {
            break;
        }
        if (is_option(lines, x)) {
            var other_option_name = lstrip(lines[x].match(regex_matches["option"])[0]);
            if (other_option_name.length > max_option_name_length) {
                max_option_name_length = other_option_name.length;
            }
        }

        x += 1;
    }
    return space_fill(max_option_name_length + 2 - option_name.length, " ");
}

var collect_option = function(lines, index) {
    var leading_space = lines[index].replace(lstrip(lines[index]), '');
    var betwixt = get_option_betwixt(lines, index);
    var option_name = lstrip(lines[index].match(regex_matches["option"])[0]);
    var rest_of_first_line = lstrip(lines[index].substr((leading_space + option_name).length));

    var output = [leading_space + option_name + betwixt + rest_of_first_line];
    for (var i = index + 1; i < lines.length; i++) {
        if (begins_with(rstrip(lines[i]), leading_space + " ")) {
            output.push(lines[i]);
        }
        else {
            return [output.join('\n'), i];
        }
    }
    return [output.join('\n'), i];
}

export default collect_option;
