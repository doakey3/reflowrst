"use babel";
var get_span_row_count = function(span) {
    /*
    Gets the number of rows included in a span
    */
    var rows = 1;
    var first_row = span[0][0];
    for (var i = 0; i < span.length; i++) {
        if (span[i][0] > first_row) {
            rows += 1;
            first_row = span[i][0];
        }
    }
    return rows;
}



export default get_span_row_count;
