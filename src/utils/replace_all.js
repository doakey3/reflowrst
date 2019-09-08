"use babel";

var replace_all = function(target, search, replacement) {
    while (target.indexOf(search) !== -1) {
        target = target.replace(search, replacement);
    }
    return target;
}

export default replace_all;
