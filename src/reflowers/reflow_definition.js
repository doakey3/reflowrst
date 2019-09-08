"use babel";
import rstrip  from '../utils/rstrip.js';
import reflow_paragraph from './reflow_paragraph.js';

var reflow_definition = function(text, space) {
    var lines = text.split("\n");
    var output = [rstrip(lines[0])];
    lines.splice(0, 1);
    var rest = reflow_paragraph(lines.join("\n"), space);
    output.push(rest);
    return (output.join("\n"));
}

export default reflow_definition;
