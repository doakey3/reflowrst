"use babel";
var pair_in_array = function(pair, arr) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i][0] == pair[0] && arr[i][1] == pair[1]) {
            return true;
        }
    }
    return false;
}

export default pair_in_array;
