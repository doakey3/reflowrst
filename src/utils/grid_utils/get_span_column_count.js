"use babel";
var get_span_column_count = function(span) {
    /*
    Gets the number of columns included in a span
    */
    var first_column = span[0][1]
    var column = first_column
    for (var i = 0; i < span.length; i++) {
        if (span[i][1] > column) {
            column = span[i][1];
        }
    }
    return (column - first_column) + 1;
}



export default get_span_column_count;
