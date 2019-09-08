import reflow from "./src/reflow.js";
import data2rst from "./src/utils/data2rst.js";
import grid2data from "./src/utils/grid2data.js";
import get_span_column_count from "./src/utils/grid_utils/get_span_column_count.js";
import get_span_row_count from "./src/utils/grid_utils/get_span_row_count.js";


var reflowrst = (function() {
    self = {};
    self.data2rst = data2rst;
    self.grid2data = grid2data;
    self.get_span_column_count = get_span_column_count;
    self.get_span_row_count = get_span_row_count;
    self.reflow = reflow;
    return self
}());

export default reflowrst;
