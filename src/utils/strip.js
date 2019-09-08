"use babel";

var strip = function(text) {
    return text.replace(/^\s+/g, "").replace(/\s+$/, "");
}

export default strip;
