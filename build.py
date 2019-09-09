from pathlib import Path
import os
from calmjs.parse import es5
import re

def get_javascript(path):
    with open(path, "r") as f:
        text = f.read()

    lines = text.split("\n")
    while not lines[0].startswith("var"):
        lines.pop(0)

    while lines[len(lines) - 1].strip() != "}" and lines[len(lines) - 1].strip() != "};":
        lines.pop()
    return "\n".join(lines)


def main():
    lib_name = os.path.basename(os.path.abspath(os.path.dirname(__file__)))
    folder = os.path.abspath(os.path.dirname(__file__))
    destination = os.path.join(folder, "build", lib_name + ".js")

    src_folder = os.path.abspath(os.path.join(os.path.dirname(__file__), "src"))
    files = list(Path(src_folder).rglob('*.js'))
    filelist = []
    for file in files:
        path = str(file)
        if not os.path.isdir(path):
            filelist.append(path)

    filelist = sorted(filelist)

    with open(os.path.join(folder, "shell.js"), "r") as f:
        shell_text = f.read()

    shell_text = shell_text.replace("//LIBNAME", lib_name)

    for file in filelist:
        if not os.path.isfile(destination) or os.path.getctime(file) > os.path.getctime(destination):
            output = []
            imports = {}
            for file in filelist:
                js = get_javascript(file)
                output.append(js)

            text = shell_text.replace("//CONTENTS", "\n".join(output))

            with open(destination, "w") as f:
                f.write(text)

            mini = es5.minify_print(text, obfuscate=True)

            with open(os.path.join(folder, "build", lib_name + ".min.js"), "w") as f:
                f.write(mini)

            break

main()

