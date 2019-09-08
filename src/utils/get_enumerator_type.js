"use babel";
var get_enumerator_type = function(s) {
    /*
    A type is made up of two different pieces: A descriptor and a formatter.

    :Descriptor: one of the following: ALPHA_UPPER, ALPHA_LOWER, ROMAN_UPPER, ROMAN_LOWER, NUMERIC, WILD
    :Formatter:  one of the following: PERIOD, PARENTHETIC, BIPARENTHETIC
    */

    var descriptor = "NUMERIC";
    var formatter = "PERIOD";

    if (s[0] == "(") {
        formatter = "BIPARENTHETIC";
    }
    else if (s[s.length - 1] == ")") {
        formatter = "PARENTHETIC";
    }

    s = s.replace(/\(|\)|\./g, "");
    if (isNaN(s)) {
        if (s.match(/[a-z]/) != null) {
            if (s.length == 1 && s != "i") {
                descriptor = "ALPHA_LOWER";
            }
            else {
                descriptor = "ROMAN_LOWER";
            }
        }
        else if (s.match(/[A-Z]/) != null) {
            if (s.length == 1 && s != "i") {
                descriptor = "ALPHA_UPPER";
            }
            else {
                descriptor = "ROMAN_UPPER";
            }
        }
        else {
            descriptor = "WILD";
        }
    }

    return descriptor + " " + formatter;

}

export default get_enumerator_type;
