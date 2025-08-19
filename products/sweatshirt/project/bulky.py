import os
import re

# ----------------------------------
# CONFIGURE THESE IF NEEDED
# ----------------------------------
SOURCE_FILE = "1.html"
IGNORE_FILES = {"1.html", "index.html"}  # We won't modify these
HTML_EXTENSION = ".html"

# This is the extra <script> code to add after the last </script>
EXTRA_SCRIPT = r"""</script>
<script>
    function updateCartCount() {
        Promise.all([fetch("/api/cart"), fetch("/api/cartp")])
            .then(async ([regularRes, personalizedRes]) => {
                const regularItems = await regularRes.json();
                const personalizedItems = await personalizedRes.json();
                const totalItems = [...regularItems, ...personalizedItems]
                    .reduce((sum, item) => sum + item.quantity, 0);
                document.getElementById("cart-count").textContent = totalItems;
            })
            .catch(() => document.getElementById("cart-count").textContent = "0");
    }

    document.addEventListener("DOMContentLoaded", updateCartCount);
</script>"""


def extract_topbar_navbar_snippet():
    """
    Reads 1.html, extracts everything from
    <!-- Topbar Start --> up to <!-- Navbar End -->.
    Returns the snippet as a string.
    """
    with open(SOURCE_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    # Regex to capture everything from <!-- Topbar Start --> to <!-- Navbar End -->
    pattern = r"<!-- Topbar Start -->(.*?)<!-- Navbar End -->"
    match = re.search(pattern, content, flags=re.DOTALL)
    if not match:
        raise ValueError(f"Could not find the snippet in {SOURCE_FILE}!")
    return match.group(0)  # Return the entire matched text, including the markers


def replace_topbar_navbar(file_path, snippet):
    """
    Replaces the existing block from <!-- Topbar Start --> to <!-- Navbar End -->
    with 'snippet'. Then appends EXTRA_SCRIPT after the last </script> tag.
    """
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1) Replace the existing <!-- Topbar Start --> ... <!-- Navbar End --> block
    #    with the snippet from 1.html
    pattern = r"<!-- Topbar Start -->.*?<!-- Navbar End -->"
    new_content = re.sub(pattern, snippet, content, flags=re.DOTALL)

    # 2) Insert the extra <script> snippet AFTER the last </script> in the file
    #    We match the final </script> with a lookahead that ensures no more </script> follows
    #    Then we append EXTRA_SCRIPT right after it
    last_script_pattern = r"(</script>)(?!.*</script>)"
    new_content = re.sub(last_script_pattern, rf"\1\n{EXTRA_SCRIPT}", new_content, flags=re.DOTALL)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)


def main():
    # Extract the snippet from 1.html
    snippet = extract_topbar_navbar_snippet()

    # Loop through all HTML files, except those we ignore
    for filename in os.listdir("."):
        if filename.endswith(HTML_EXTENSION) and filename not in IGNORE_FILES:
            print(f"Processing {filename} ...")
            replace_topbar_navbar(filename, snippet)

    print("Done! All applicable HTML files have been updated.")


if __name__ == "__main__":
    main()
