TRIGGERS = {
    "fragrance": ["fragrance", "parfum"],
    "sulfates": ["sls", "sodium lauryl sulfate"],
    "comedogenic": ["isopropyl myristate", "coconut oil"],
    "alcohol": ["alcohol denat", "ethanol"]
}

def detect_triggers(ingredients):
    found = []

    for category, keywords in TRIGGERS.items():
        for ing in ingredients:
            for key in keywords:
                if key in ing:
                    found.append({
                        "ingredient": ing,
                        "type": category
                    })

    return found