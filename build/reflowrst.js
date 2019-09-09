var reflowrst = (function() {
var collect_bullet = function(lines, index) {
    var output = [lines[index]];
    var leading_space = lines[index].replace(lstrip(lines[index]), '');
    index += 1;

    while (index < lines.length) {
        if (begins_with(lines[index], leading_space + ' ') &&
            lstrip(lines[index]) != '' &&
            !is_bullet(lines, index) &&
            !is_enumerated(lines, index) &&
            !is_todo(lines, index)) {

                output.push(lstrip(lines[index]))
                index += 1;
        }
        else {
            return [output.join(' '), index];
        }
    }
    return [output.join(' '), index];
}
var collect_definition = function(lines, index) {
    var output = [lines[index]];

    var leading_space = lines[index].replace(lstrip(lines[index]), "");

    index += 1;

    while (index < lines.length) {
        if (begins_with(lines[index], leading_space) &&
            lstrip(lines[index]) != " ") {

            output.push("    " + lstrip(lines[index]))
            index += 1;
        }
        else {
            return [output.join("\n"), index];
        }
    }
    return [output.join("\n"), index];
}
var collect_directive = function(lines, index) {
    var output = [lines[index]];
    var leading_space = lines[index].replace(lstrip(lines[index]), "");

    index += 1;

    while (index < lines.length) {
        if (begins_with(lines[index], leading_space + " ") &&
            lstrip(lines[index]) != " ") {

            output.push(lines[index])
            index += 1;
        }
        else {
            return [output.join("\n"), index];
        }
    }
    return [output.join("\n"), index];
}
var romanize = function(num) {
    if (isNaN(num))
        return NaN;
    var digits = String(+num).split(""),
        key = ["","C","CC","CCC","CD","D","DC","DCC","DCCC","CM",
               "","X","XX","XXX","XL","L","LX","LXX","LXXX","XC",
               "","I","II","III","IV","V","VI","VII","VIII","IX"],
        roman = "",
        i = 3;
    while (i--)
        roman = (key[+digits.pop() + (i * 10)] || "") + roman;
    return Array(+digits.join("") + 1).join("M") + roman;
}

var alpha2number = function(s) {
    var s = s.toUpperCase();
    if (s.match(/[A-Z]/) == null) {
        return 1;
    }
    return s.charCodeAt(0) - 64;
};

var number2alpha = function(n) {
    if (n > 64) n = 26;
    if (n < 1) n = 1;
    return String.fromCharCode(64 + n);
};

var get_ordered_list_start = function(lines, i, enumerator_type) {
    var nonstartable_romans = ["V", "X", "L", "C", "D", "M"];

    var enumerator = lines[i].match(regex_matches["enumerator"])[0];
    var leading_space = enumerator.replace(lstrip(enumerator), "");
    enumerator = lstrip(enumerator);
    var enumerator_body = enumerator.replace(/\(|\)|\./g, "");
    var enumerator_type = enumerator_type || get_enumerator_type(enumerator);
    var enumerator_descriptor = enumerator_type.split(" ")[0];
    var enumerator_formatter = enumerator_type.split(" ")[1];

    var prev_counts = 0;
    var start = i;
    while (start > 0) {
        var is_previous_content = (rstrip(lines[start]) == "" || begins_with(lines[start], leading_space + " "));
        var is_previous_enumerator = (start < i && is_enumerated(lines, start) && lines[start].replace(lstrip(lines[start]), "") == leading_space);

        if (!is_previous_content && !is_previous_enumerator && start < i) {
            break;
        }
        else if (is_previous_enumerator) {
            var previous_enumerator = lstrip(lines[start].match(regex_matches["enumerator"])[0]);
            var previous_body = previous_enumerator.replace(/\(|\)|\./g, "");
            var previous_type = get_enumerator_type(previous_enumerator);
            var previous_descriptor = previous_type.split(" ")[0];
            var previous_formatter = previous_type.split(" ")[1];

            if (previous_descriptor == "WILD" && enumerator_formatter == previous_formatter) {
                // pass
            }
            else if (enumerator_descriptor == "WILD" && enumerator_formatter == previous_formatter) {
                // pass
            }
            else if (start == i - 1 && enumerator_body.toUpperCase() == "I" && previous_descriptor.split("_")[0] == "ALPHA") {
                if (enumerator_body == enumerator_body.toUpperCase()) {
                    enumerator_descriptor = "ALPHA_UPPER";
                }
                else {
                    enumerator_descriptor = "ALPHA_LOWER";
                }
                enumerator_type = enumerator_descriptor + " " + enumerator_formatter;
            }
            else if (start == i - 1 && nonstartable_romans.indexOf(enumerator_body.toUpperCase()) != -1 && previous_descriptor.split("_")[0] == "ROMAN") {
                if (enumerator_body == enumerator_body.toUpperCase()) {
                    enumerator_descriptor = "ROMAN_UPPER";
                }
                else {
                    enumerator_descriptor = "ROMAN_LOWER";
                }
                enumerator_type = enumerator_descriptor + " " + enumerator_formatter;
            }
            else if (previous_type != enumerator_type) {
                start += 1;
                break;
            }
        }
        start -= 1;
    }

    while (start < lines.length) {
        if (is_enumerated(lines, start) && lines[start].replace(lstrip(lines[start]), "") == leading_space) {
            break;
        }
        start += 1;
    }

    var first_enumerator = lstrip(lines[start].match(regex_matches["enumerator"])[0]);

    var first_type = get_enumerator_type(first_enumerator);
    var first_descriptor = first_type.split(" ")[0];
    var first_body = first_enumerator.replace(/\(|\)|\./g, "").toUpperCase();

    return [start, enumerator_type];
};

var get_corrected_enumeration = function(lines, i) {
    /*
    Analyze the previous enumerators and return the appropriate number, roman
    numeral, or alphabetic representation of the enumerator.
    */
    var enumerator = lines[i].match(regex_matches["enumerator"])[0];
    var leading_space = enumerator.replace(lstrip(enumerator), "");
    enumerator = lstrip(enumerator);

    var arr = get_ordered_list_start(lines, i);
    var start = arr[0];
    var enumerator_type = arr[1];
    var enumerator_descriptor = enumerator_type.split(" ")[0];
    var enumerator_formatter = enumerator_type.split(" ")[1];

    if (enumerator_descriptor == "WILD") {
        return enumerator;
    }

    var unstartable_romans = ["V", "X", "L", "C", "D", "M"];
    var enumerator_count = 0;

    var first_number = 0;
    var first_formatter = "NUMERIC PERIOD";

    for (var x = start; x < i + 1; x++) {
        if (!is_enumerated(lines, x) && rstrip(lines[x - 1]) == "" && lines[x].replace(lstrip(lines[x]), "").length <= leading_space) {
            break;
        }
        else if (is_enumerated(lines, x) && lines[x].replace(lstrip(lines[x]), "") == leading_space) {
            var current_enumerator = lstrip(lines[x].match(regex_matches["enumerator"])[0]);
            var current_body = current_enumerator.replace(/\(|\)|\./g, "");
            var current_type = get_enumerator_type(current_enumerator);
            var current_descriptor = current_type.split(" ")[0];
            var current_formatter = current_type.split(" ")[1];

            if (current_type == enumerator_type || (enumerator_descriptor == "WILD" && current_formatter == enumerator_formatter) || (current_descriptor == "WILD" && current_formatter == enumerator_formatter) || (unstartable_romans.indexOf(current_body.toUpperCase()) != -1 && enumerator_descriptor.split("_")[0] == "ROMAN")) {
                if (enumerator_count == 0) {
                    var current_type = get_enumerator_type(current_enumerator);
                    var current_descriptor = current_type.split(" ")[0];
                    var current_formatter = current_type.split(" ")[1];
                    first_formatter = current_formatter;
                    var first_enumerator = current_enumerator.replace(/\(|\)|\./g, "");

                    if (current_descriptor == "WILD") {
                        first_number = 1;
                    }
                    else if (current_descriptor == "NUMERIC") {
                        first_number = parseInt(first_enumerator);
                    }
                    else if (current_descriptor.split('_')[0] == "ALPHA") {
                        first_number = alpha2number(first_enumerator);
                    }
                    else {
                        // Roman numeral lists must start at 1.
                        first_number = 1;
                    }
                }
                enumerator_count += 1;
            }
            else {
                break;
            }
        }
    }

    var enumerator_number = first_number + enumerator_count - 1;
    var enumerator_body = "1";
    if (enumerator_descriptor == "NUMERIC") {
        enumerator_body = enumerator_number.toString();
    }
    else if (enumerator_descriptor.split('_')[0] == "ALPHA") {
        enumerator_body = number2alpha(enumerator_number);
    }
    else {
        enumerator_body = romanize(enumerator_number);
    }

    if (enumerator_descriptor.split('_').length > 1) {
        var secondary_descriptor = enumerator_descriptor.split('_')[1];
        if (secondary_descriptor == "LOWER") {
            enumerator_body = enumerator_body.toLowerCase();
        }
    }

    if (enumerator_formatter == "PERIOD") {
        enumerator_body += ".";
    }
    else if (enumerator_formatter == "PARENTHETIC") {
        enumerator_body += ")";
    }
    else {
        enumerator_body = "(" + enumerator_body + ")";
    }

    return enumerator_body;
};

var get_enumerated_betwixt = function(lines, i) {
    /*
    Gets the space that should be between the enumerator and the text::

        9.  this is an enumerated list
        10. Notice that the betwixt spaces are different because the enumerator
            widths are different.
           ^
     (betwixt space)
    */
    var enumerator = lines[i].match(regex_matches["enumerator"])[0];
    var leading_space = enumerator.replace(lstrip(enumerator), "");
    enumerator = lstrip(enumerator);
    var enumerator_body = enumerator.replace(/\(|\)|\./g, "");
    var arr = get_ordered_list_start(lines, i);
    var start = arr[0];

    var enumerator_type = arr[1];
    var enumerator_descriptor = enumerator_type.split(" ")[0];
    var enumerator_formatter = enumerator_type.split(" ")[1];

    if (enumerator_descriptor.split("_")[0] == "ALPHA") {
        return " ";
    }

    var unstartable_romans = ["V", "X", "L", "C", "D", "M"];
    var max_enumerator_length = 0;
    for (var x = start; x < lines.length; x++) {
        if (!is_enumerated(lines, x) && rstrip(lines[x - 1]) == "" && lines[x].replace(lstrip(lines[x]), "").length <= leading_space) {
            break;
        }
        else if (is_enumerated(lines, x) && lines[x].replace(lstrip(lines[x]), "") == leading_space) {
            var current_enumerator = lstrip(lines[x].match(regex_matches["enumerator"])[0]);
            var current_body = current_enumerator.replace(/\(|\)|\./g, "");
            var current_type = get_enumerator_type(current_enumerator);
            var current_descriptor = current_type.split(" ")[0];
            var current_formatter = current_type.split(" ")[1];

            if (current_type == enumerator_type || (enumerator_descriptor == "WILD" && current_formatter == enumerator_formatter) || (current_descriptor == "WILD" && current_formatter == enumerator_formatter) || (unstartable_romans.indexOf(current_body.toUpperCase()) != -1 && enumerator_descriptor.split("_")[0] == "ROMAN")) {
                if (current_enumerator.length > max_enumerator_length) {
                    max_enumerator_length = current_enumerator.length;
                }
            }

            else {
                break;
            }
        }
    }
    return space_fill(max_enumerator_length + 1 - enumerator.length, " ");
};

var collect_enumerated = function(lines, index) {
    var leading_space = lines[index].replace(lstrip(lines[index]), '');
    var enumerator = lines[index].match(regex_matches["enumerator"])[0];
    var rest = lstrip(lines[index].substr(enumerator.length));
    enumerator = get_corrected_enumeration(lines, index);

    lines[index] = leading_space + enumerator + " " + rest;

    var betwixt = get_enumerated_betwixt(lines, index);

    var output = [leading_space + enumerator + betwixt + rest];

    for (var i = index + 1; i < lines.length; i++) {
        if (rstrip(lines[i]) != "" && begins_with(rstrip(lines[i]), leading_space) && !is_bullet(lines, i) && !is_enumerated(lines, i)) {
            output.push(lines[i]);
        }
        else {
            return [output.join('\n'), i];
        }
    }

    return [output.join('\n'), i];
}
var get_field_betwixt = function(lines, i) {
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
    var betwixt = get_field_betwixt(lines, index);
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
var collect_grid_table = function(lines, index) {
    var output = [];
    for (var i = index; i < lines.length; i++) {
        var first_char = lstrip(lines[i])[0];
        if (first_char != "|" && first_char != '+') {
            return [output.join('\n'), i];
        }
        output.push(lines[i]);
    }

    return [output.join('\n'), i];
}
var collect_main_title = function(lines, index) {
    var output = [rstrip(lines[index]), rstrip(lines[index + 1]), rstrip(lines[index + 2])].join('\n');
    return [output, index + 3];
}
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
var collect_paragraph = function(lines, index) {
    var output = [lines[index]];
    var leading_space = lines[index].replace(lstrip(lines[index]), '');
    index += 1;

    while (index < lines.length) {
        if (begins_with(lines[index], leading_space) && lstrip(lines[index]) != '') {
            output.push(lines[index]);
            index += 1;
        }
        else {
            var text = output.join("\n");
            return [text, index];
        }
    }
    var text = output.join("\n");
    return [text, index];
}
var collect_simple_table = function(lines, index) {
    var header_line = lines[index];
    var output = [lines[index]];
    for (var i = index + 1; i < lines.length; i++) {
        output.push(lines[i]);
        if (rstrip(lines[i]) == header_line) {
            if (i == lines.length - 1) {
                return [output.join('\n'), i + 1];
            }
            else if (rstrip(lines[i + 1]) == "") {
                return [output.join('\n'), i + 1];
            }
        }
    }

    return [output.join('\n'), i + 1];
}
var collect_title = function(lines, index) {
    var output = [rstrip(lines[index]), rstrip(lines[index + 1])].join('\n');
    return [output, index + 2];
}
var is_bullet = function(lines, index) {
    if (lines[index].match(regex_matches["bullet"])) {
        return true;
    }
    return false;
}
var is_comment = function(lines, index) {
    if (lines[index].match(regex_matches["comment"]) != null) {
        return true
    }
    return false;
}
var is_definition = function(lines, index) {
    if (index < lines.length - 1) {
        var leading_space = lines[index].replace(lstrip(lines[index]), "");
        if (lstrip(lines[index + 1]) != "" && begins_with(lines[index + 1], leading_space + " ")) {
            return true;
        }
    }
    return false;
}
var is_directive = function(lines, index) {
    if (lines[index].match(/^ *\.\. /) != null && lines[index].match(/::/) != null) {
        return true;
    }
    return false;
}
var is_enumerated = function(lines, index) {
    var leading_space = lines[index].replace(lstrip(lines[index]), "");
    var match = lines[index].match(regex_matches["enumerator"]);
    if (match == null) {
        return false;
    }
    var enumerator = lstrip(match[0]);
    var enumerator_type = get_enumerator_type(enumerator);

    if (enumerator_type.match(/ROMAN/)) {
        if (!deromanize(enumerator.replace(/\(|\)|\./g, ""))) {
            return false;
        }
    }

    if (leading_space.length > 0 && index > 0) {
        if (index == 0) {
            return true;
        }
        else if (lstrip(lines[index - 1]) == "") {
            return true;
        }
        else if (lines[index - 1].replace(lstrip(lines[index - 1]), "") == leading_space && is_enumerated(lines, index - 1)) {
            return true;
        }
        else if (index > 1 && is_title(lines, index - 2)) {
            return true;
        }
        else {
            return false;
        }
    }
    return true
}
var is_field = function(lines, index) {
    var leading_space = lines[index].replace(lstrip(lines[index]), "");

    var match = lines[index].match(regex_matches["field"]);
    if (match == null) {
        return false;
    }
    if (leading_space.length > 0 && index > 0) {
        if (lstrip(lines[index - 1]) == "") {
            return true;
        }
        else if (lines[index - 1].replace(lstrip(lines[index - 1]), "") == leading_space && is_field(lines, index - 1)) {
            return true;
        }
        else if (lines[index - 1].replace(lstrip(lines[index - 1]), "").length > leading_space.length) {
            return true;
        }
        else if (index > 1 && is_title(lines, index - 2)) {
            return true;
        }
        else if (lines[index - 1].replace(lstrip(lines[index - 1]), "").length < leading_space.length && (is_directive(lines, index - 1) || is_substitution_definition(lines, index - 1) || is_comment(lines, index - 1))) {
            return true;
        }
        else {
            return false;
        }
    }
    return true
}
var is_grid_table = function(lines, index) {
    if (begins_with(lstrip(lines[index]), '+---')) {
        return true;
    }
}
var is_horizontal_rule = function(lines, index) {
    var valid_chars = ["!", '"', "#", "$", "%", "&", "'", "(", ")", "*", "+", ",", "-", ".", "/", ":", ";", "<", "=", ">", "?", "@", "[", "\\", "]", "^", "_", "`", "{", "|", "}", "~"];
    if (rstrip(lines[index]).length >= 4) {
        var char = lines[index][0];
        if (valid_chars.indexOf(char) != -1 &&
            is_only(rstrip(lines[index]), char) &&
            index > 0 &&
            index < split_lines(rstrip(lines.join('\n'))).length - 1 &&
            rstrip(lines[index - 1]) == "" &&
            rstrip(lines[index + 1]) == "") {

            return true;
        }
    }
    return false;
}
var is_main_title = function(lines, index) {
    var valid_symbols = ["!", '"', "#", "$", "%", "&", "'", "(", ")", "*", "+", ",", "-", ".", "/", ":", ";", "<", "=", ">", "?", "@", "[", "\\", "]", "^", "_", "`", "{", "|", "}", "~"]
    var lines = lines;
    var index = index;
    if (index > lines.length - 3) {
        return false;
    }

    if (valid_symbols.indexOf(lstrip(lines[index])[0]) != -1) {
        var symbol = lstrip(lines[index])[0];

        if (is_only(strip(lines[index]), [symbol]) &&
            is_only(strip(lines[index + 2]), [symbol]) &&
            strip(lines[index]).length >= rstrip(lines[index + 1]).length &&
            strip(lines[index]).length == strip(lines[index + 2]).length) {

            return true;
        }
        return false;
    }
    return false;
}
var is_option = function(lines, index) {
    var leading_space = lines[index].replace(lstrip(lines[index]), "");

    if (lines[index].match(regex_matches["option"]) != null) {

        if (leading_space.length > 0 && index > 0) {
            if (lstrip(lines[index - 1]) == "") {
                return true;
            }
            else if (lines[index - 1].replace(lstrip(lines[index - 1]), "") == leading_space && is_option(lines, index - 1)) {
                return true;
            }
            else if (lines[index - 1].replace(lstrip(lines[index - 1]), "").length > leading_space.length) {
                return true;
            }
            else if (index > 1 && is_title(lines, index - 2)) {
                return true;
            }
            else {
                return false;
            }
        }

        return true;
    }
    return false;
}
var is_simple_table = function(lines, index) {
    var line = strip(lines[index]);
    if (is_only(line, ['=', ' ']) && line.split(' ').length > 1 && line.replace(/[^\=]/g).length > 3) {
        return true;
    }
    return false;
}
var is_substitution_definition = function(lines, index) {
    if (lines[index].match(regex_matches["substitution_definition"]) != null) {
        return true;
    }
    return false;
}
var is_title = function(lines, index) {
    var valid_symbols = ["!", '"', "#", "$", "%", "&", "'", "(", ")", "*", "+", ",", "-", ".", "/", ":", ";", "<", "=", ">", "?", "@", "[", "\\", "]", "^", "_", "`", "{", "|", "}", "~"]

    if (index > lines.length - 2) {
        return false;
    }
    if (valid_symbols.indexOf(lstrip(lines[index + 1])[0]) != -1) {
        var symbol = lstrip(lines[index + 1])[0];

        if (is_only(strip(lines[index + 1]), [symbol]) &&
            strip(lines[index]).length == strip(lines[index + 1]).length) {
            return true;
        }
        return false;
    }
    return false;
}
var is_todo = function(lines, index) {
    if (lines[index].match(regex_matches["todo"])) {
        return true;
    }
    return false;
}
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
var reflow_bullet = function(text, space) {
    var leading_space = text.replace(lstrip(text), '');
    var first_char = lstrip(text).match(regex_matches["bullet"])[0];
    var rest = strip(text.substr(leading_space.length + first_char.length));

    var interspace = ' ';

    var intro = leading_space + first_char + interspace;

    var new_space = space - intro.length;
    if (space > 0 && new_space < 1) {
        new_space = intro.length;
    }
    var reflowed = reflow_paragraph(rest, new_space);

    var r_lines = reflowed.split('\n');
    for (var i = 1; i < r_lines.length; i++) {
        r_lines[i] = space_fill(intro.length, " ") + r_lines[i];
    }

    reflowed = intro + r_lines.join('\n');
    return reflowed;
}
var reflow_definition = function(text, space) {
    var lines = text.split("\n");
    var output = [rstrip(lines[0])];
    lines.splice(0, 1);
    var rest = reflow_paragraph(lines.join("\n"), space);
    output.push(rest);
    return (output.join("\n"));
}
var reflow_directive = function(text, space) {
    var lines = text.split('\n');
    var leading_space = lines[0].replace(lstrip(lines[0]), "");
    var reflowed = [lines[0]];
    lines.splice(0, 1);

    var i = 0;
    var holder = [];
    while (i < lines.length) {
        if (is_field(lines, i)) {
            //console.log(lines[i]);
            holder = collect_field(lines, i);
            reflowed.push(reflow_field(holder[0], space));
            i = holder[1];
        }
        else {
            break;
        }
    }
    lines.splice(0, i + 1);
    reflowed = reflowed.concat(lines);
    return reflowed.join("\n");
}
var reflow_enumerated = function(text, space) {
    var leading_space = text.replace(lstrip(text), '');
    var enumerator = strip(text.match(regex_matches["enumerator"])[0]);

    var rest = text.substr((leading_space + enumerator).length)
    var betwixt = rest.replace(lstrip(rest), "").split('\n')[0];
    rest = strip(rest);

    var intro = leading_space + enumerator + betwixt;
    var reflowed = reflow_paragraph(rest, space - intro.length);

    var r_lines = reflowed.split('\n');
    for (var i = 1; i < r_lines.length; i++) {
        r_lines[i] = space_fill(intro.length, " ") + r_lines[i];
    }

    reflowed = intro + r_lines.join('\n');

    return reflowed;
}
var reflow_field = function(text, space) {
    var leading_space = text.replace(lstrip(text), '');
    var field_name = strip(text.match(regex_matches["field"])[0]);

    var rest = text.substr((leading_space + field_name).length)

    if (strip(rest) == "") {
        return leading_space + field_name + rest;
    }

    var betwixt = rest.replace(lstrip(rest), "").split('\n')[0];
    rest = lstrip(rest);

    var intro = leading_space + field_name + betwixt;

    var split = rest.split('\n');
    var paragraphs = [[split[0]]];

    split.splice(0, 1);

    for (var i = 0; i < split.length; i++) {
        split[i] = lstrip(split[i]);
    }

    for (var i = 0; i < split.length; i++) {
        if (split[i].length > 0) {
            paragraphs[paragraphs.length - 1].push(split[i]);
        }
        else {
            paragraphs.push([""]);
            if (i < split.length - 1) {
                paragraphs.push([]);
            }
        }
    }

    for (var i = 0; i < paragraphs.length; i++) {
        paragraphs[i] = paragraphs[i].join('\n');
    }

    var reflowed = [];

    var new_space = space - intro.length;
    if (space > 0 && new_space < 1) {
        new_space = intro.length;
    }
    for (var i = 0; i < paragraphs.length; i++) {
        reflowed.push(rstrip(reflow_paragraph(paragraphs[i], new_space)));
    }

    reflowed = reflowed.join('\n');

    var r_lines = reflowed.split('\n');
    for (var i = 1; i < r_lines.length; i++) {
        r_lines[i] = space_fill(intro.length, " ") + r_lines[i];
    }

    reflowed = intro + r_lines.join('\n');

    return reflowed;
}
var reflow_main_title = function(text, space) {
    var space = space;
    var lines = split_lines(text);
    var leading_space = lines[0].replace(lstrip(lines[0]), '');
    for (var i = 0; i < lines.length; i++) {
        lines[i] = lines[i].substr(leading_space.length);
    }

    lines[1] = lstrip(lines[1]);

    var title_space = lines[0].length;
    var symbol = lstrip(lines[0])[0];

    if (title_space <= space) {
        lines[1] = rstrip(center_text(lines[1], title_space));
    }
    else if (rstrip(lines[1]).length <= space) {
        lines[0] = space_fill(space, symbol);
        lines[1] = rstrip(center_text(lines[1], space));
        lines[2] = lines[0];
    }
    else {
        lines[0] = space_fill(strip(lines[1]).length, symbol);
        lines[1] = strip(lines[1]);
        lines[2] = lines[0];
    }

    for (var i = 0; i < lines.length; i++) {
        lines[i] = leading_space + lines[i];
    }

    return lines.join('\n');
}
var reflow_option = function(text, space) {
    var leading_space = text.replace(lstrip(text), '');
    var option_name = strip(text.match(regex_matches["option"])[0]);

    var rest = text.substr((leading_space + option_name).length)
    var betwixt = rest.replace(lstrip(rest), "").split('\n')[0];
    rest = strip(rest);

    var intro = leading_space + option_name + betwixt;
    var reflowed = reflow_paragraph(rest, space - intro.length);

    var r_lines = reflowed.split('\n');
    for (var i = 1; i < r_lines.length; i++) {
        r_lines[i] = space_fill(intro.length, " ") + r_lines[i];
    }

    reflowed = intro + strip(r_lines.join('\n'));

    return reflowed;
}
var get_words = function(text) {
    var inline_encountered = false;
    var parts = [""];
    var i = 0;
    while (i < text.length) {
        if (i < text.length - 1 && text[i] == "`" && text[i + 1] == "`" && inline_encountered == false) {
            parts.push("``");
            inline_encountered = true;
            i += 2;

        }
        else if (i < text.length - 1 && text[i] == "`" && text[i - 1] == "`" && inline_encountered == true) {
            parts[parts.length - 1] += text[i];
            inline_encountered = false;
            parts.push("");
            i += 1
        }
        else {
            if (text[i] == "\n" && inline_encountered == false) {
                parts[parts.length - 1] += " ";
            }
            else {
                parts[parts.length - 1] += text[i];
            }
            i += 1;
        }
    }

    var words = [];
    for (var i = 0; i < parts.length; i++) {
        if (begins_with(parts[i], "``")) {
            var split = parts[i].split("\n");
            for (var x = 0; x < split.length - 1; x++) {
                split[x] = rstrip(split[x]) + "\n";
            }
            words = words.concat(split);
        }
        else {
            words = words.concat(clean_split(parts[i].split(" ")));
        }
    }
    return words;
};

var reflow_paragraph = function(text, space) {
    var lines = text.split('\n');
    var leading_space = lines[0].replace(lstrip(lines[0]), "");

    for (var i = 0; i < lines.length; i++) {
        lines[i] = lines[i].substr(leading_space.length);
    }

    var text = lines.join('\n');
    var new_space = space - leading_space.length;
    var words = get_words(text);

    if (space <= 0) {
        var growing_string = leading_space;
        for (var i = 0; i < words.length; i++) {
            if (growing_string[growing_string.length - 1] != "\n") {
                if (growing_string == leading_space) {
                    growing_string += words[i];
                }
                else {
                    growing_string += " " + words[i];
                }
            }
            else {
                growing_string += words[i];
            }
        }

        return growing_string;
    }

    var growing_string = "";
    var output_list = [];

    while (words.length > 0) {
        if (growing_string == "") {
            growing_string += words[0];
            words.splice(0, 1);
        }

        else if (growing_string[growing_string.length - 1] == "\n") {
            output_list.push(growing_string);
            growing_string = "";
        }

        else if ((growing_string + ' ' + words[0]).length <= new_space) {
            growing_string += ' ' + words[0];
            words.splice(0, 1);
        }

        else {
            output_list.push(growing_string + '\n')
            growing_string = "";
        }
    }
    output_list.push(growing_string);

    for (var i = 0; i < output_list.length; i++) {
        output_list[i] = leading_space + output_list[i];
    }

    var output_text = output_list.join('');
    return output_text;
}
var reflow_todo = function(text, space) {
    var leading_space = text.replace(lstrip(text), '');
    var first_char = lstrip(text).match(regex_matches["todo"])[0];
    var rest = strip(text.substr(leading_space.length + first_char.length));

    var interspace = ' ';

    var intro = leading_space + first_char + interspace;
    var reflowed = reflow_paragraph(rest, space - intro.length);

    var r_lines = reflowed.split('\n');
    for (var i = 1; i < r_lines.length; i++) {
        r_lines[i] = space_fill(intro.length, " ") + r_lines[i];
    }

    reflowed = intro + r_lines.join('\n');
    return reflowed;
}
var begins_with = function(text, pattern) {
    if (text.length == 0) {
        return false;
    }
    // Check if text starts with string (works with IE)
    for (var i = 0; i < pattern.length; i++) {
        if (text[i] != pattern[i]) {
            return false;
        }
    }
    return true;
}
var center_text = function(line, space) {
    // Pad left and right of a string to center it within space
    // Must be using monospace font to work

    var remaining = space - line.length;
    var space_count = Math.floor(remaining / 2)
    var output = space_fill(space_count, ' ') + line + space_fill(remaining - space_count, ' ');
    return output;
}
var clean_split = function(split_array) {
    var i = 0;
    while (i < split_array.length) {
        split_array[i] = strip(split_array[i]);
        if (split_array[i] == '') {
            split_array.splice(i, 1);
        }
        else {
            i += 1;
        }
    }

    return split_array;
}
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
var deromanize = function(str) {
	var	str = str.toUpperCase(),
		validator = /^M*(?:D?C{0,3}|C[MD])(?:L?X{0,3}|X[CL])(?:V?I{0,3}|I[XV])$/,
		token = /[MDLV]|C[MD]?|X[CL]?|I[XV]?/g,
		key = {M:1000,CM:900,D:500,CD:400,C:100,XC:90,L:50,XL:40,X:10,IX:9,V:5,IV:4,I:1},
		num = 0, m;
	if (!(str && validator.test(str)))
		return false;
	while (m = token.exec(str))
		num += key[m[0]];
	return num;
}
var get_enumerator_type = function(s) {
    /*
    A type is made up of two different pieces: A descriptor and a formatter.

    :Descriptor: one of the following: ALPHA_UPPER, ALPHA_LOWER, ROMAN_UPPER, ROMAN_LOWER, NUMERIC, WILD
    :Formatter:  one of the following: PERIOD, PARENTHETIC, BIPARENTHETIC
    */

    var descriptor = "NUMERIC";
    var formatter = "PERIOD";

    if (s[0] == "(") {
        formatter = "BIPARENTHETIC";
    }
    else if (s[s.length - 1] == ")") {
        formatter = "PARENTHETIC";
    }

    s = s.replace(/\(|\)|\./g, "");
    if (isNaN(s)) {
        if (s.match(/[a-z]/) != null) {
            if (s.length == 1 && s != "i") {
                descriptor = "ALPHA_LOWER";
            }
            else {
                descriptor = "ROMAN_LOWER";
            }
        }
        else if (s.match(/[A-Z]/) != null) {
            if (s.length == 1 && s != "i") {
                descriptor = "ALPHA_UPPER";
            }
            else {
                descriptor = "ROMAN_UPPER";
            }
        }
        else {
            descriptor = "WILD";
        }
    }

    return descriptor + " " + formatter;

}
var get_sum = function(total, number) {
    return total + number;
}
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
var get_bullet_breakpoints = function(line) {
    var leading_space = line.replace(lstrip(line), '');
    var line = lstrip(line);
    var words = line.split(" ");

    var breakpoints = [];
    var growing_string = words.splice(0, 2).join(" ");
    for (var i = 0; i < words.length; i++) {
        growing_string += words[i] + " ";
        breakpoints.push(rstrip(growing_string).length);
    }
    breakpoints = Array.from(new Set(breakpoints)).sort(function(a, b) {
        if (a < b) return -1;
        if (a > b) return 1;
    });

    for (var i = 0; i < breakpoints.length; i++) {
        breakpoints[i] += leading_space.length;
    }
    return breakpoints;
}
var get_field_breakpoints = function(line) {
    var leading_space = line.replace(lstrip(line), '');
    var line = lstrip(line);

    var field = line.match(/(^\:|^ +[\:]).*?:(?= |$)/)[0];
    var rest_of_text = line.substr(field.length);
    var betwixt = rest_of_text.replace(lstrip(rest_of_text), '');
    rest_of_text = lstrip(rest_of_text);

    var words = rest_of_text.split(" ");
    var breakpoints = [];
    var growing_string = field + betwixt + words[0];
    for (var i = 0; i < words.length; i++) {
        growing_string += words[i] + " ";
        breakpoints.push(rstrip(growing_string).length);
    }
    breakpoints = Array.from(new Set(breakpoints)).sort(function(a, b) {
        if (a < b) return -1;
        if (a > b) return 1;
    });

    for (var i = 0; i < breakpoints.length; i++) {
        breakpoints[i] += leading_space.length;
    }
    return breakpoints;
}
var get_paragraph_breakpoints = function(line) {
    var leading_space = line.replace(lstrip(line), '');
    var line = lstrip(line);
    var words = line.split(" ");

    var breakpoints = [];
    var growing_string = "";
    for (var i = 0; i < words.length; i++) {
        growing_string += words[i] + " ";
        breakpoints.push(rstrip(growing_string).length);
    }
    breakpoints = Array.from(new Set(breakpoints)).sort(function(a, b) {
        if (a < b) return -1;
        if (a > b) return 1;
    });

    for (var i = 0; i < breakpoints.length; i++) {
        breakpoints[i] += leading_space.length;
    }
    return breakpoints;
}
var generate_empty_table = function(row_count, column_count) {
    /*
    Create an array of arrays of empty strings...
    a shell that will contain the grid's data.
    */
    var table = [];
    for (var r = 0; r < row_count; r++) {
        table.push([]);
        for (var c = 0; c < column_count; c++) {
            table[table.length - 1].push("");
        }
    }
    return table;
}
var get_longest_line_length = function(text) {
    /*
    Get the length longest line in a paragraph
    */
    var lines = text.split('\n');
    var length = 0;
    for (var i = 0; i < lines.length; i++) {
        if (lines[i].length > length) {
            length = lines[i].length;
        }
    }
    return length;
}
var get_span_character_width = function(span, widths, interspace) {
    /*
    Sum the character widths of a span
    */
    var interspace = interspace || "";

    var start_column = span[0][1];
    var column_count = get_span_column_count(span);
    var total_width = 0;
    for (var i = start_column; i < start_column + column_count; i++) {
        total_width += widths[i];
    }
    if (interspace == "") {
        total_width += column_count - 1;
    }
    else {
        total_width += (interspace.length * (column_count - 1))
    }
    return total_width;
}
var get_span_column_count = function(span) {
    /*
    Gets the number of columns included in a span
    */
    var first_column = span[0][1]
    var column = first_column
    for (var i = 0; i < span.length; i++) {
        if (span[i][1] > column) {
            column = span[i][1];
        }
    }
    return (column - first_column) + 1;
}
var get_span_from_span_group = function(row, column, spans) {
    /*
    Given a row and column, retrieve the span from the span group that contains
    that row and column (if it exists, else return null);
    */
    for (var i = 0; i < spans.length; i++) {
        if (pair_in_array([row, column], spans[i])) {
            return spans[i];
        }
    }
    return null;
}
var get_span_line_count = function(span, row_heights) {
    /*
    This function gets the total line count of a span
    */
    var start_row = span[0][0];
    var row_count = get_span_row_count(span);
    var line_count = 0;
    for (var i = start_row; i < start_row + row_count; i++) {
        line_count += row_heights[i];
    }
    line_count += row_count - 1;
    return line_count;
}
var get_span_row_count = function(span) {
    /*
    Gets the number of rows included in a span
    */
    var rows = 1;
    var first_row = span[0][0];
    for (var i = 0; i < span.length; i++) {
        if (span[i][0] > first_row) {
            rows += 1;
            first_row = span[i][0];
        }
    }
    return rows;
}
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
var normalize_spans = function(table, spans) {
    /*
    Users only need to provide spans for merged columns and rows, but for
    programming purposes, it is easier to consider every cell a span, even if
    that span is only across a single row and column.

    This creates a list of spans that accounts for all rows and columns in the
    table.
    */
    var new_spans = [];
    for (var row = 0; row < table.length; row++) {
        for (var column = 0; column < table[row].length; column++) {
            var span = get_span_from_span_group(row, column, spans);
            if (span == null) {
                new_spans.push([[row, column]]);
            }
        }
    }
    new_spans = new_spans.concat(spans);
    new_spans = new_spans.sort(function(a, b) {
        if (a[0] < b[0]) return -1;
        if (a[0] > b[0]) return 1;
        if (a[0] == b[0] && a[1] < b[1]) return -1;
        if (a[0] == b[0] && a[1] > b[1]) return 1;
    });

    return new_spans;
}
var pair_in_array = function(pair, arr) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i][0] == pair[0] && arr[i][1] == pair[1]) {
            return true;
        }
    }
    return false;
}
var is_only = function(text, chars) {
    // Check if a string is made up only of certain characters
    if (text == '') {
        return false;
    }
    for (var i = 0; i < text.length; i++) {
        if (chars.indexOf(text.substring(i, i + 1)) == -1) {
            return false;
        }
    }
    return true;
}
var lstrip = function(text) {
    return text.replace(/^\s+/g, "");
}
var regex_matches = {
    "field": /(^\:|^ +[\:]).*?:(?= | *$)/,
    "bullet": /^ *(\*|-|\+|•|‣|⁃)(?= | *$)/,
    "enumerator": /^ *([A-Za-z]|#|[0-9]+|[ivxlcdmIVXLCDM]+)(\.|\))(?= |$)|^ *\(([A-Za-z]|#|[0-9]+|[ivxlcdmIVXLCDM]+)\)(?= | *$)/,
    "option": /^ *(((-[a-zA-Z0-9])|(--([a-zA-Z0-9]+[a-zA-Z0-9_-]*))|(\/[a-zA-Z0-9_-]+)|(\+[a-zA-Z]))(( |=)([a-zA-Z][a-zA-Z0-9_-]+)|( |=)(<[^<>]+>))?(, )?)+(?=  | *$)/,
    "footnote": /^ *\.\. \[([0-9]|#([A-Za-z0-9]([A-Za-z0-9]|[-_\.\:\+](?![-_\.\:\+]))+[A-Za-z0-9])?|\*)\](?= | *$)/,
    "citation": /^ *\.\. \[[A-Za-z0-9]([A-Za-z0-9]|[-_\.\:\+](?![-_\.\:\+]))+[A-Za-z0-9]\](?= | *$)/,
    "hyperlink": /^ *\.\. _[A-Za-z0-9]([A-Za-z0-9]|[-_\.\:\+](?![-_\.\:\+]))+[A-Za-z0-9]\:(?= | *$)|^ *\.\. __\:(?= | *$)|^ *__(?= | *$)/,
    "directive": /^ *\.\. [A-Za-z0-9]([A-Za-z0-9]|[-_\.\:\+](?![-_\.\:\+]))+[A-Za-z0-9]\:\:(?= | *$)/,
    "substitution_definition": /^ *\.\. \|\S.*\S\| [A-Za-z0-9]([A-Za-z0-9]|[-_\.\:\+](?![-_\.\:\+]))+[A-Za-z0-9]\:\:(?= | *$)/,
    "comment": /^ *\.\.(?= | *$)/,
    "todo": /^ *\[[ x]\](?= | *$)/,
}
var replace_all = function(target, search, replacement) {
    while (target.indexOf(search) !== -1) {
        target = target.replace(search, replacement);
    }
    return target;
}
var rstrip = function(text) {
    return text.replace(/\s+$/, "");
}
var shuffle = function(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}
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
var sort_number = function(a, b) {
    return b - a;
}
var space_fill = function(count, symbol) {
    // Create a string that is 'count' long of 'symbol'
    var output = '';
    var i = 0;
    for (i = 0; i < count; i++) {
        output = output + symbol;
    }
    return output;
}
var split_lines = function(text) {
    // Split lines by newlines, even newlines of different formats
    var re=/\r\n|\n\r|\n|\r/g;
    var lines = text.replace(re,"\n").split("\n");
    for (var i = 0; i < lines.length; i++) {
        lines[i] = lines[i].replace(/\s+$/, "");
    }
    return lines;
}
var strip = function(text) {
    return text.replace(/^\s+/g, "").replace(/\s+$/, "");
}
var truncate_lines = function(text) {
    var lines = split_lines(text);

    var pre_split = 0;
    for (var i = 0; i < lines.length; i++) {
        if (rstrip(lines[i]) == "") {
            pre_split += 1;
        }
        else {
            break;
        }
    }

    lines.splice(0, pre_split);

    return rstrip(lines.join('\n'));
}
self = {};
self.data2rst = data2rst;
self.grid2data = grid2data;
self.get_span_column_count = get_span_column_count;
self.get_span_row_count = get_span_row_count;
self.reflow = reflow;
return self
}());
