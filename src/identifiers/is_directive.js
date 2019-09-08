"use babel";

var is_directive = function(lines, index) {
    if (lines[index].match(/^ *\.\. /) != null && lines[index].match(/::/) != null) {
        return true;
    }
    return false;
}

export default is_directive;
