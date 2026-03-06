INFLAMMATORY_FLAGS = {
    # increases score
    "sugar": 3,
    "refined flour": 3,
    "maida": 3,
    "trans fat": 4,
    "partially hydrogenated": 4,
    "palm oil": 2,
    "high fructose": 3,
    "sodium benzoate": 2,
    "artificial colour": 1,
    "sweetener": 2,
    "preservative": 2,

    # decreases score (negative values)
    "turmeric": -2,
    "omega-3": -3,
    "flaxseed": -2,
    "zinc": -2,
    "fiber": -1,
    "green tea": -2,
}

ALLERGEN_MULTIPLIER = 1.5
LUTEAL_MULTIPLIER = 1.3
LUTEAL_TRIGGERS = ["dairy", "milk", "cheese", "paneer", "butter", "cream", "sugar"]

def calculate_score(ingredients_text, nutriments, user_allergens=[], hormonal_phase=None):
    score = 0
    ingredients_lower = ingredients_text.lower()

    # apply ingredient flags
    for ingredient, weight in INFLAMMATORY_FLAGS.items():
        if ingredient in ingredients_lower:
            score += weight

    # nutrition based additions
    sugar_100g = nutriments.get('sugars_100g', 0) or 0
    fat_100g = nutriments.get('saturated-fat_100g', 0) or 0

    if sugar_100g > 10:
        score += 3
    elif sugar_100g > 5:
        score += 1

    if fat_100g > 5:
        score += 2

    # allergen multiplier
    for allergen in user_allergens:
        if allergen.lower() in ingredients_lower:
            score = score * ALLERGEN_MULTIPLIER

    # luteal phase multiplier
    if hormonal_phase == "luteal":
        for trigger in LUTEAL_TRIGGERS:
            if trigger in ingredients_lower:
                score = score * LUTEAL_MULTIPLIER
                break

    return round(score, 2)