"use babel";

import begins_with from "../utils/begins_with.js";
import split_lines from "../utils/split_lines.js";
import clean_split from "../utils/clean_split.js";
import lstrip from "../utils/lstrip.js";
import rstrip from "../utils/rstrip.js";
import space_fill from "../utils/space_fill.js";

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

export default reflow_paragraph;
