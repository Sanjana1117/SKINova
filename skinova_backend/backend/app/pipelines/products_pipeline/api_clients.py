import requests

def fetch_from_barcode(barcode: str):
    url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"

    res = requests.get(url)
    if res.status_code != 200:
        return None

    data = res.json()

    if data.get("status") != 1:
        return None

    product = data.get("product", {})

    return {
        "name": product.get("product_name"),
        "ingredients": product.get("ingredients_text", "")
    }