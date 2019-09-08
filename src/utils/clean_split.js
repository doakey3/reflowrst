"use babel";

import strip from './strip.js';

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

export default clean_split;
