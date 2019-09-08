"use babel";
import pair_in_array from './pair_in_array.js';

var get_span_from_span_group = function(row, column, spans) {
    /*
    Given a row and column, retrieve the span from the span group that contains
    that row and column (if it exists, else return null);
    */
    for (var i = 0; i < spans.length; i++) {
        if (pair_in_array([row, column], spans[i])) {
            return spans[i];
        }
    }
    return null;
}

export default get_span_from_span_group;
