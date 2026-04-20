"""
Coffee Admin — Apriori Algorithm Engine
Discovers association rules: "Customers who buy X also buy Y"
Run: python3 apriori_engine.py
"""

import json
import os
from collections import defaultdict
import pandas as pd

BASE_PATH = r"C:\Users\ishaa\Downloads\coffee-admin"
SALES_CSV   = os.path.join(BASE_PATH, r"src\main\resources\data\201904_sales_reciepts.csv")
PRODUCT_CSV = os.path.join(BASE_PATH, r"src\main\resources\data\product.csv")
OUTPUT_JSON = os.path.join(BASE_PATH, r"src\main\resources\static\ml_results.json")

print("Loading data...")
sales    = pd.read_csv(SALES_CSV)
products = pd.read_csv(PRODUCT_CSV)

prod_names = dict(zip(products["product_id"], products["product"]))
prod_cats  = dict(zip(products["product_id"], products["product_category"]))

# ── Build transaction baskets ─────────────────────────────────────────────────
baskets     = sales.groupby("transaction_id")["product_id"].apply(set).reset_index()
basket_list = [frozenset(row) for row in baskets["product_id"]]
N           = len(basket_list)
print(f"  Transactions: {N}")

MIN_SUPPORT    = 0.02   # 2%
MIN_CONFIDENCE = 0.25   # 25%

# ── Step 1: Compute support of a given itemset ────────────────────────────────
def get_support(itemset, baskets):
    count = sum(1 for b in baskets if itemset.issubset(b))
    return count / len(baskets)

# ── Step 2: Apriori — find all frequent itemsets ──────────────────────────────
def apriori(baskets, min_sup):
    items = set(item for basket in baskets for item in basket)
    # L1: frequent single items
    L = {}
    for item in items:
        sup = get_support(frozenset([item]), baskets)
        if sup >= min_sup:
            L[frozenset([item])] = sup
    freq = dict(L)
    k = 2
    while L:
        prev = list(L.keys())
        candidates = set()
        for i in range(len(prev)):
            for j in range(i + 1, len(prev)):
                union = prev[i] | prev[j]
                if len(union) == k:
                    candidates.add(union)
        L = {}
        for c in candidates:
            sup = get_support(c, baskets)
            if sup >= min_sup:
                L[c] = sup
        freq.update(L)
        k += 1
        if k > 3:
            break
    return freq

print("  Running Apriori...")
frequent_sets = apriori(basket_list, MIN_SUPPORT)
print(f"  Frequent itemsets found: {len(frequent_sets)}")

# ── Step 3: Generate association rules ────────────────────────────────────────
rules = []
two_item_sets = {k: v for k, v in frequent_sets.items() if len(k) == 2}

for itemset, set_sup in two_item_sets.items():
    items = list(itemset)
    for antecedent in [frozenset([items[0]]), frozenset([items[1]])]:
        consequent = itemset - antecedent
        ant_sup    = frequent_sets.get(antecedent, 0)
        if ant_sup == 0:
            continue
        confidence = set_sup / ant_sup
        con_sup    = frequent_sets.get(consequent, 0)
        lift       = confidence / con_sup if con_sup > 0 else 0

        if confidence >= MIN_CONFIDENCE and lift >= 1.0:
            ant_id = list(antecedent)[0]
            con_id = list(consequent)[0]
            rules.append({
                "antecedent":     ant_id,
                "antecedentName": prod_names.get(ant_id, f"Product {ant_id}"),
                "antecedentCat":  prod_cats.get(ant_id, ""),
                "consequent":     con_id,
                "consequentName": prod_names.get(con_id, f"Product {con_id}"),
                "consequentCat":  prod_cats.get(con_id, ""),
                "support":        round(set_sup, 4),
                "supportPct":     round(set_sup * 100, 2),
                "confidence":     round(confidence, 4),
                "confidencePct":  round(confidence * 100, 2),
                "lift":           round(lift, 4),
            })

rules.sort(key=lambda r: (-r["lift"], -r["confidence"]))
top_rules = rules[:20]

stats = {
    "totalTransactions": N,
    "minSupport":        MIN_SUPPORT,
    "minSupportPct":     MIN_SUPPORT * 100,
    "minConfidence":     MIN_CONFIDENCE,
    "minConfidencePct":  MIN_CONFIDENCE * 100,
    "frequentItemsets":  len(frequent_sets),
    "totalRules":        len(rules),
    "avgLift":           round(sum(r["lift"] for r in rules) / max(len(rules), 1), 3),
    "avgConfidence":     round(sum(r["confidence"] for r in rules) / max(len(rules), 1), 3),
    "avgConfidencePct":  round(sum(r["confidence"] for r in rules) / max(len(rules), 1) * 100, 2),
}

output = {
    "generatedAt": pd.Timestamp.now().isoformat(),
    "stats": stats,
    "rules": top_rules,
}

with open(OUTPUT_JSON, "w") as f:
    json.dump(output, f, indent=2)

print(f"  Total rules: {len(rules)} | Top 20 saved")
print(f"  Top rule: {top_rules[0]['antecedentName']} → {top_rules[0]['consequentName']}")
print(f"  Lift={top_rules[0]['lift']} | Confidence={top_rules[0]['confidencePct']}%")
print(f"\n✅ Apriori results saved to {OUTPUT_JSON}")
