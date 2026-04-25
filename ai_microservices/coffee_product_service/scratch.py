import traceback
from main import get_product, get_product_by_name
from database import SessionLocal

print("Testing get_product('prod_001')")
db = SessionLocal()
try:
    print(get_product('prod_001', db))
except Exception as e:
    traceback.print_exc()

print("\nTesting get_product_by_name('Ember Dark Roast')")
try:
    print(get_product_by_name('Ember Dark Roast', db))
except Exception as e:
    traceback.print_exc()

db.close()
