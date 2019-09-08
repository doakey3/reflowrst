"use babel";

import strip from "../utils/strip.js";
import lstrip from "../utils/lstrip.js";
import rstrip from "../utils/rstrip.js";
import space_fill from "../utils/space_fill.js";
import begins_with from "../utils/begins_with.js";
import regex_matches from "../utils/regex_matches.js";

import is_field from "../identifiers/is_field.js";

var get_betwixt = function(lines, i) {
    /*
    Gets the space that should be between the field name and the field
    text::

    :Field Name:    The field text starts after the betwixt. Betwixt space
                    changes based on the width of field names that come before
                    and after the current field name

                ^^^^
          (betwixt space)
    */
    var field_name = lstrip(lines[i].match(regex_matches["field"])[0]);

    var start = i;
    while (start > 0) {
        if (rstrip(lines[start]) == "") {
            break
        }
        start -= 1;
    }

    while (start < lines.length) {
        if (is_field(lines, start)) {
            break
        }
        start += 1;
    }

    var max_field_name_length = 0;
    var x = start;
    while (x < lines.length) {
        if (rstrip(lines[x]) == "") {
            break;
        }
        if (is_field(lines, x)) {
            var other_field_name = lstrip(lines[x].match(regex_matches["field"])[0]);
            if (other_field_name.length > max_field_name_length) {
                max_field_name_length = other_field_name.length;
            }
        }

        x += 1;
    }
    return space_fill(max_field_name_length + 1 - field_name.length, " ");
}

var collect_field = function(lines, index) {
    var leading_space = lines[index].replace(lstrip(lines[index]), '');
    var betwixt = get_betwixt(lines, index);
    var field_name = lstrip(lines[index].match(regex_matches["field"])[0]);
    var rest_of_first_line = lstrip(lines[index].substr((leading_space + field_name).length));

    var output = [leading_space + field_name + betwixt + rest_of_first_line];
    var block_leading_space = "";
    for (var i = index + 1; i < lines.length; i++) {
        if (block_leading_space == "" && begins_with(rstrip(lines[i]), leading_space + " ")) {
            output.push(lines[i]);
            block_leading_space = lines[i].replace(lstrip(lines[i]), "");
        }
        else if ((begins_with(rstrip(lines[i]), block_leading_space) && block_leading_space != leading_space) || rstrip(lines[i]) == "") {
            if (leading_space == "" || (lines[i].replace(lstrip(lines[i]), "") != leading_space)) {
                output.push(lines[i]);
            }
            else {
                return [output.join('\n'), i];
            }
        }
        else {
            break;
        }
    }
    return [output.join('\n'), i];
}

export default collect_field;
