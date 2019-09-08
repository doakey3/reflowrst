"use babel";

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

export default is_only;
