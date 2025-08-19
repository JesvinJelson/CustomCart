import os

# Define product mappings with respective JavaScript functions
products = {
    "clock1": {"name": "Personalized Clock", "price": 28.99},
    "neclace": {"name": "Name Necklace", "price": 25.99},
    "door": {"name": "Personalized Doormat", "price": 24.99},
    "watch": {"name": "Engraved Watch", "price": 49.99},
    "wallet2": {"name": "His & Her Wallet Set", "price": 30.99},
    "choco": {"name": "Chocolate Hamper", "price": 10.99},
    "rings": {"name": "Customized Ring", "price": 39.99},
    "heart": {"name": "Heart-Shaped Lamp", "price": 24.99},
    "neo": {"name": "Name Neon Sign", "price": 29.99},
    "bag": {"name": "Personalized Travel Bag", "price": 15.99},
    "towels": {"name": "Monogrammed Towels", "price": 19.99},
    "candle": {"name": "Custom Candle Set", "price": 14.99}
}

# JavaScript function template with escaped curly braces
js_template = """
<script>
function addToCart_{id}(productId) {{
    const customText = document.getElementById('custom-text').value;
    const quantity = parseInt(document.getElementById('quantity').value) || 1;

    if (!customText || customText.length > 20) {{
        alert('Please enter custom text (max 20 characters)');
        return;
    }}

    fetch("/api/cartp/add", {{
        method: "POST",
        headers: {{ "Content-Type": "application/json" }},
        body: JSON.stringify({{
            productid: productId,
            pname: "{name}",
            price: "{price}",
            quantity: quantity,
            customText: customText
        }}),
    }})
    .then(response => response.json())
    .then(data => {{
        updateCartCount();
        alert('Added to cart!');
    }})
    .catch(console.error);
}}
</script>
"""

# Iterate through files and update the respective HTML files
for file in os.listdir():
    if file.endswith(".html") and file[:-5] in products:
        product = products[file[:-5]]
        script_content = js_template.format(
            id=file[:-5],
            name=product["name"],
            price=str(product["price"])
        )
        with open(file, "a", encoding="utf-8") as html_file:
            html_file.write(script_content)
            print(f"Updated: {file}")
