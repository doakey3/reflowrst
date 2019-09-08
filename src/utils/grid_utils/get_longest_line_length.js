"use babel";
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

export default get_longest_line_length;
