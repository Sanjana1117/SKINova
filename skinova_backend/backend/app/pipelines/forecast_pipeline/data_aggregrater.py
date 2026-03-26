from app.db.mongodb import db

def get_user_timeseries(user_id, start_date, end_date):
    
    skin = list(db.skin.find({
        "user_id": user_id,
        "date": {"$gte": start_date, "$lte": end_date}
    }))

    food = list(db.food.find({
        "user_id": user_id,
        "date": {"$gte": start_date, "$lte": end_date}
    }))

    cycle = list(db.cycles.find({
        "user_id": user_id,
        "date": {"$gte": start_date, "$lte": end_date}
    }))

    products = list(db.products.find({
        "user_id": user_id,
        "date": {"$gte": start_date, "$lte": end_date}
    }))

    return {
        "skin": skin,
        "food": food,
        "cycle": cycle,
        "products": products
    }