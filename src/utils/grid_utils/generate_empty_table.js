"use babel";
var generate_empty_table = function(row_count, column_count) {
    /*
    Create an array of arrays of empty strings...
    a shell that will contain the grid's data.
    */
    var table = [];
    for (var r = 0; r < row_count; r++) {
        table.push([]);
        for (var c = 0; c < column_count; c++) {
            table[table.length - 1].push("");
        }
    }
    return table;
}

export default generate_empty_table;
