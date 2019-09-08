"use babel";

var space_fill = function(count, symbol) {
    // Create a string that is 'count' long of 'symbol'
    var output = '';
    var i = 0;
    for (i = 0; i < count; i++) {
        output = output + symbol;
    }
    return output;
}

export default space_fill;
