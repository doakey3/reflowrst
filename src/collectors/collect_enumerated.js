"use babel";

import lstrip from "../utils/lstrip.js";
import rstrip from "../utils/rstrip.js";
import space_fill from "../utils/space_fill.js";
import begins_with from "../utils/begins_with.js";
import regex_matches from "../utils/regex_matches.js";
import get_enumerator_type from "../utils/get_enumerator_type.js";

import is_bullet from "../identifiers/is_bullet.js";
import is_enumerated from "../identifiers/is_enumerated.js";

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


export default collect_enumerated;
