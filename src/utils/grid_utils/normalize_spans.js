"use babel";
import get_span_from_span_group from './get_span_from_span_group.js';

var normalize_spans = function(table, spans) {
    /*
    Users only need to provide spans for merged columns and rows, but for
    programming purposes, it is easier to consider every cell a span, even if
    that span is only across a single row and column.

    This creates a list of spans that accounts for all rows and columns in the
    table.
    */
    var new_spans = [];
    for (var row = 0; row < table.length; row++) {
        for (var column = 0; column < table[row].length; column++) {
            var span = get_span_from_span_group(row, column, spans);
            if (span == null) {
                new_spans.push([[row, column]]);
            }
        }
    }
    new_spans = new_spans.concat(spans);
    new_spans = new_spans.sort(function(a, b) {
        if (a[0] < b[0]) return -1;
        if (a[0] > b[0]) return 1;
        if (a[0] == b[0] && a[1] < b[1]) return -1;
        if (a[0] == b[0] && a[1] > b[1]) return 1;
    });

    return new_spans;
}

export default normalize_spans;
