def parse_ingredients(raw_text: str):
    if not raw_text:
        return []

    ingredients = [i.strip().lower() for i in raw_text.split(",")]

    return ingredients