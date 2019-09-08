"use babel";

var split_lines = function(text) {
    // Split lines by newlines, even newlines of different formats
    var re=/\r\n|\n\r|\n|\r/g;
    var lines = text.replace(re,"\n").split("\n");
    for (var i = 0; i < lines.length; i++) {
        lines[i] = lines[i].replace(/\s+$/, "");
    }
    return lines;
}

export default split_lines
