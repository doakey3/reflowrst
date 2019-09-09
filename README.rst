=========
reflowrst
=========
A Javascript function for reflowing reStructuredText (rst) text into a character
width.

Usage
=====
HTML
----
.. code:: html

    <script src="reflowrst.min.js"></script>

Javascript
----------
.. code:: javascript

    var text = "The quick brown fox jumped over the lazy dog.";
    var reflowed = reflowrst.reflow(text, 40);

    console.log(reflowed);

Demo: https://jsfiddle.net/r7ew10pg/
