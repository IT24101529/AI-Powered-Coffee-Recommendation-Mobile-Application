# product_seeder.py
# Populates the database with 50+ coffee products.
# Run once: python product_seeder.py
# Owner: Ekanayake E.M.T.D.B. | IT24100917

from database import SessionLocal, create_tables, CoffeeProduct

# (name, category, price, description,
#  sweetness, bitterness, acidity, richness, caffeine, warmth,
#  calories, temperature, best_moods, best_weather, best_times)
PRODUCTS = [
    # ── HOT ESPRESSO-BASED ────────────────────────────────────────────────────
    ('Espresso',          'Espresso',  200, 'Concentrated shot of pure coffee',                          1, 9, 8, 9, 10, 9,   5,  'Hot',     'Tired,Stressed',       'Cold,Rainy',      'Morning,Afternoon'),
    ('Double Espresso',   'Espresso',  280, 'Two shots for maximum energy',                              1, 9, 8, 9, 10, 9,  10,  'Hot',     'Tired',                'Any',             'Morning,Afternoon'),
    ('Ristretto',         'Espresso',  230, 'Short, intense espresso with deeper sweetness',             2, 8, 6, 9, 10, 9,   5,  'Hot',     'Tired,Calm',           'Cold',            'Morning'),
    ('Americano',         'Espresso',  250, 'Espresso diluted with hot water',                           1, 7, 6, 7,  8, 8,  10,  'Hot',     'Tired,Calm',           'Cold',            'Morning,Afternoon'),
    ('Long Black',        'Espresso',  260, 'Double espresso over hot water, preserving crema',          1, 8, 7, 8,  9, 9,  10,  'Hot',     'Tired,Calm',           'Cold,Rainy',      'Morning,Afternoon'),
    ('Macchiato',         'Espresso',  260, 'Espresso with a dash of foam',                              1, 8, 7, 9,  9, 9,  15,  'Hot',     'Tired,Excited',        'Any',             'Morning,Afternoon'),
    ('Cortado',           'Espresso',  300, 'Equal espresso and warm milk',                              2, 7, 5, 8,  8, 9,  60,  'Hot',     'Calm,Tired',           'Cold',            'Morning'),

    # ── HOT LATTES ────────────────────────────────────────────────────────────
    ('Cappuccino',        'Latte',     380, 'Equal parts espresso, milk, foam',                          4, 6, 4, 7,  7, 9, 120,  'Hot',     'Calm,Happy',           'Warm,Cold',       'Morning,Afternoon'),
    ('Latte',             'Latte',     400, 'Espresso with steamed milk',                                5, 4, 3, 6,  6, 8, 150,  'Hot',     'Calm,Happy,Sad',       'Any',             'Morning,Afternoon,Evening'),
    ('Flat White',        'Latte',     380, 'Ristretto with velvety microfoam',                          3, 6, 5, 8,  8, 9, 100,  'Hot',     'Calm,Tired',           'Cold',            'Morning,Afternoon'),
    ('Piccolo Latte',     'Latte',     300, 'Ristretto with a small amount of steamed milk',             2, 7, 5, 8,  9, 9,  50,  'Hot',     'Tired,Calm',           'Cold',            'Morning'),

    # ── HOT SPECIALTY ─────────────────────────────────────────────────────────
    ('Caramel Macchiato', 'Specialty', 480, 'Vanilla latte topped with caramel drizzle',                8, 3, 2, 7,  6, 8, 250,  'Hot',     'Happy,Excited',        'Warm,Cold',       'Afternoon,Evening'),
    ('Mocha',             'Specialty', 450, 'Espresso with chocolate and steamed milk',                  8, 5, 2, 8,  6, 8, 290,  'Hot',     'Happy,Sad',            'Cold,Rainy',      'Afternoon,Evening'),
    ('Hazelnut Latte',    'Specialty', 460, 'Latte with rich hazelnut syrup',                            7, 3, 2, 6,  6, 8, 220,  'Hot',     'Happy,Calm',           'Warm',            'Afternoon,Evening'),
    ('Vanilla Latte',     'Specialty', 440, 'Latte with sweet vanilla syrup',                            7, 2, 2, 6,  6, 8, 200,  'Hot',     'Calm,Happy,Anxious',   'Any',             'Any'),
    ('Lavender Latte',    'Specialty', 480, 'Calming lavender infused latte',                            6, 2, 2, 5,  3, 8, 180,  'Hot',     'Stressed,Anxious,Sad', 'Any',             'Evening,Night'),
    ('Honey Oat Latte',   'Specialty', 480, 'Espresso with oat milk and golden honey',                  7, 3, 2, 6,  6, 8, 190,  'Hot',     'Calm,Happy',           'Any',             'Morning,Afternoon'),
    ('Brown Sugar Latte', 'Specialty', 490, 'Latte with brown sugar and cinnamon syrup',                 8, 3, 2, 6,  6, 8, 210,  'Hot',     'Happy,Sad',            'Cold,Rainy',      'Afternoon,Evening'),
    ('Pistachio Latte',   'Specialty', 510, 'Latte with pistachio cream topping',                        7, 3, 2, 7,  6, 8, 230,  'Hot',     'Happy,Excited',        'Warm',            'Afternoon'),
    ('Toffee Nut Latte',  'Specialty', 500, 'Latte with toffee nut syrup and whipped cream',             9, 2, 1, 7,  6, 8, 260,  'Hot',     'Happy,Excited',        'Cold',            'Afternoon,Evening'),
    ('Cinnamon Latte',    'Specialty', 460, 'Warm latte dusted with cinnamon',                           6, 3, 2, 6,  6, 8, 195,  'Hot',     'Calm,Happy',           'Cold,Rainy',      'Morning,Afternoon'),
    ('Rose Latte',        'Specialty', 490, 'Delicate rose-infused latte with oat milk',                 6, 2, 2, 5,  4, 8, 170,  'Hot',     'Happy,Calm',           'Warm',            'Afternoon'),

    # ── HOT TEA-BASED ─────────────────────────────────────────────────────────
    ('Chai Latte',        'Tea',       380, 'Spiced masala tea with steamed milk',                       7, 1, 2, 6,  2, 8, 200,  'Hot',     'Calm,Stressed',        'Cold,Rainy',      'Afternoon,Evening'),
    ('Matcha Latte',      'Tea',       420, 'Ceremonial matcha with oat milk',                           5, 3, 3, 5,  4, 8, 150,  'Hot',     'Calm,Anxious',         'Any',             'Morning,Afternoon'),
    ('Turmeric Latte',    'Tea',       410, 'Golden milk with turmeric and spices',                      5, 2, 2, 5,  0, 8, 160,  'Hot',     'Stressed,Anxious',     'Cold,Rainy',      'Evening,Night'),
    ('London Fog',        'Tea',       400, 'Earl Grey tea latte with vanilla and steamed milk',          5, 1, 2, 5,  1, 8, 130,  'Hot',     'Calm,Anxious',         'Rainy,Cold',      'Afternoon,Evening'),

    # ── HOT OTHER ─────────────────────────────────────────────────────────────
    ('Hot Chocolate',     'Other',     350, 'Rich, creamy Belgian hot chocolate',                        9, 3, 1, 8,  0, 9, 320,  'Hot',     'Sad,Stressed',         'Cold,Rainy',      'Evening,Night'),
    ('White Hot Choco',   'Other',     370, 'Smooth white chocolate with steamed milk',                 10, 0, 0, 7,  0, 9, 340,  'Hot',     'Happy,Sad',            'Cold,Rainy',      'Evening,Night'),
    ('Decaf Latte',       'Decaf',     400, 'All the latte flavour, zero caffeine',                      5, 3, 3, 5,  0, 8, 150,  'Hot',     'Anxious,Stressed',     'Any',             'Evening,Night'),

    # ── ICED ──────────────────────────────────────────────────────────────────
    ('Iced Americano',    'Iced',      300, 'Bold espresso poured over ice',                             1, 7, 6, 6,  8, 1,  10,  'Iced',    'Tired,Excited',        'Hot,Warm',        'Morning,Afternoon'),
    ('Iced Latte',        'Iced',      420, 'Espresso with cold milk over ice',                          4, 4, 3, 5,  6, 1, 120,  'Iced',    'Happy,Calm',           'Hot,Warm',        'Afternoon'),
    ('Cold Brew',         'Iced',      380, '12-hour cold-steeped, smooth and strong',                   2, 5, 3, 7,  9, 1,  15,  'Iced',    'Tired,Excited',        'Hot',             'Afternoon'),
    ('Nitro Cold Brew',   'Iced',      420, 'Cold brew infused with nitrogen for creamy texture',        1, 5, 2, 8, 10, 1,  10,  'Iced',    'Tired,Excited',        'Hot',             'Afternoon'),
    ('Iced Mocha',        'Iced',      480, 'Chocolate espresso drink over ice',                         8, 4, 2, 6,  6, 1, 280,  'Iced',    'Happy,Excited',        'Hot',             'Afternoon'),
    ('Iced Caramel Latte','Iced',      460, 'Caramel latte served over ice',                             8, 2, 2, 5,  6, 1, 240,  'Iced',    'Happy,Excited',        'Hot,Warm',        'Afternoon'),
    ('Iced Matcha Latte', 'Tea',       440, 'Ceremonial matcha with cold oat milk and ice',              5, 2, 2, 4,  3, 1, 140,  'Iced',    'Calm,Anxious',         'Hot',             'Afternoon'),
    ('Iced Chai',         'Tea',       400, 'Spiced chai concentrate poured over ice',                   7, 1, 2, 5,  2, 1, 180,  'Iced',    'Calm,Happy',           'Hot,Warm',        'Afternoon'),
    ('Iced Vanilla Latte','Iced',      430, 'Vanilla sweet cream cold foam latte',                       8, 2, 2, 5,  6, 1, 220,  'Iced',    'Happy,Excited',        'Hot',             'Afternoon'),
    ('Iced Brown Sugar',  'Iced',      450, 'Shaken espresso with brown sugar and ice',                  7, 4, 3, 5,  7, 1, 190,  'Iced',    'Happy,Tired',          'Hot',             'Morning,Afternoon'),

    # ── BLENDED / FRAPPE ──────────────────────────────────────────────────────
    ('Caramel Frappe',    'Blended',   520, 'Blended ice coffee with caramel syrup and cream',           9, 2, 1, 6,  5, 1, 400,  'Blended', 'Happy,Excited',        'Hot',             'Afternoon'),
    ('Mocha Frappe',      'Blended',   500, 'Blended chocolate coffee ice drink',                        9, 3, 1, 7,  5, 1, 420,  'Blended', 'Happy,Excited',        'Hot',             'Afternoon'),
    ('Vanilla Frappe',    'Blended',   480, 'Creamy vanilla blended ice coffee',                         9, 1, 1, 5,  4, 1, 380,  'Blended', 'Happy',                'Hot',             'Afternoon'),
    ('Matcha Frappe',     'Blended',   490, 'Blended matcha with milk and ice',                          6, 2, 2, 5,  3, 1, 320,  'Blended', 'Calm,Happy',           'Hot',             'Afternoon'),
    ('Strawberry Frappe', 'Blended',   510, 'Strawberry blended with cream and ice',                    10, 0, 2, 5,  0, 1, 350,  'Blended', 'Happy,Excited',        'Hot',             'Afternoon'),

    # ── SEASONAL / SPECIAL ────────────────────────────────────────────────────
    ('Pumpkin Spice Latte','Specialty',500, 'Espresso with pumpkin spice syrup and steamed milk',        8, 2, 2, 7,  6, 8, 270,  'Hot',     'Happy,Calm',           'Cold',            'Afternoon,Evening'),
    ('Peppermint Mocha',  'Specialty', 490, 'Chocolate espresso with peppermint flavour',                8, 4, 2, 7,  6, 8, 280,  'Hot',     'Happy,Excited',        'Cold',            'Afternoon,Evening'),
    ('Irish Coffee',      'Specialty', 550, 'Hot coffee with Irish whiskey and cream (non-alcoholic version)', 4, 6, 4, 8, 7, 9, 150, 'Hot', 'Tired,Calm',          'Cold,Rainy',      'Evening'),
]


def seed_database():
    create_tables()
    db = SessionLocal()
    try:
        existing = db.query(CoffeeProduct).count()
        if existing > 0:
            print(f'Database already has {existing} products. Skipping seed.')
            return
        for p in PRODUCTS:
            product = CoffeeProduct(
                name=p[0], category=p[1], price=p[2], description=p[3],
                sweetness=p[4], bitterness=p[5], acidity=p[6], richness=p[7],
                caffeine=p[8], warmth=p[9], calories=p[10], temperature=p[11],
                best_moods=p[12], best_weather=p[13], best_times=p[14]
            )
            db.add(product)
        db.commit()
        print(f'Successfully seeded {len(PRODUCTS)} coffee products!')
    finally:
        db.close()


if __name__ == '__main__':
    seed_database()
