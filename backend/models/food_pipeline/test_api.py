import requests
from scoring import calculate_score

def get_food_info(barcode):
    url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
    response = requests.get(url)
    return response.json()['product']

product = get_food_info("8000500418512")

ingredients = product.get('ingredients_text', '')
nutriments = product.get('nutriments', {})

score = calculate_score(
    ingredients_text=ingredients,
    nutriments=nutriments,
    user_allergens=["milk"],
    hormonal_phase="luteal"
)

print("Product:", product.get('product_name'))
print("Ingredients:", ingredients)
print("Inflammatory Risk Score:", score)