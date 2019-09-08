"use babel";

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

export default begins_with;
