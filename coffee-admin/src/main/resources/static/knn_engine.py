"""
Coffee Admin — KNN Collaborative Filtering Engine
Item-based recommendation using K-Nearest Neighbours with cosine similarity
Run: python3 knn_engine.py
"""

import json
import itertools
import os

import numpy as np
import pandas as pd
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import MinMaxScaler

BASE_PATH = r"C:\Users\ishaa\Downloads\coffee-admin"
SALES_CSV   = os.path.join(BASE_PATH, r"src\main\resources\data\201904_sales_reciepts.csv")
PRODUCT_CSV = os.path.join(BASE_PATH, r"src\main\resources\data\product.csv")
OUTPUT_JSON = os.path.join(BASE_PATH,r"src/main/resources/static/knn_results.json")

print("Loading data...")
sales    = pd.read_csv(SALES_CSV)
products = pd.read_csv(PRODUCT_CSV)

prod_names = dict(zip(products["product_id"], products["product"]))
prod_cats  = dict(zip(products["product_id"], products["product_category"]))

# ── Step 1: Build item-user matrix ────────────────────────────────────────────
pivot = sales.pivot_table(
    index="product_id", columns="customer_id",
    values="quantity", aggfunc="sum", fill_value=0
)
print(f"  Item-user matrix: {pivot.shape[0]} products × {pivot.shape[1]} customers")

# ── Step 2: Normalise with Min-Max scaling ────────────────────────────────────
scaler        = MinMaxScaler()
matrix_scaled = scaler.fit_transform(pivot.values)

# ── Step 3: KNN with cosine similarity ───────────────────────────────────────
K   = 6  # 5 neighbours + itself
knn = NearestNeighbors(n_neighbors=K, metric="cosine", algorithm="brute")
knn.fit(matrix_scaled)
distances, indices = knn.kneighbors(matrix_scaled)
all_pids = list(pivot.index)
print(f"  KNN fitted | K={K-1} neighbours | Metric=cosine")

# ── Step 4: Compute evaluation metrics ───────────────────────────────────────
# Precision@5: fraction of top-5 neighbours in same category
precisions = []
for i, pid in enumerate(all_pids):
    cat_i      = prod_cats.get(pid, "")
    nbr_cats   = [prod_cats.get(all_pids[indices[i][j]], "") for j in range(1, K)]
    same_cat   = sum(1 for c in nbr_cats if c == cat_i)
    precisions.append(same_cat / (K - 1))
avg_precision = round(sum(precisions) / len(precisions), 4)

# Intra-list similarity (ILS)
ils_scores = []
for i in range(len(all_pids)):
    nbr_vecs = [matrix_scaled[indices[i][j]] for j in range(1, K)]
    if len(nbr_vecs) < 2:
        continue
    sims = []
    for a, b in itertools.combinations(nbr_vecs, 2):
        dot  = np.dot(a, b)
        norm = np.linalg.norm(a) * np.linalg.norm(b)
        sims.append(dot / norm if norm > 0 else 0)
    ils_scores.append(sum(sims) / len(sims))
avg_ils = round(sum(ils_scores) / max(len(ils_scores), 1), 4)

# ── Step 5: Build recommendations list ───────────────────────────────────────
knn_recs = []
for i, pid in enumerate(all_pids):
    nbrs = []
    for j in range(1, K):
        nbr_pid = all_pids[indices[i][j]]
        sim     = round(1 - distances[i][j], 4)
        nbrs.append({
            "productId":     nbr_pid,
            "productName":   prod_names.get(nbr_pid, f"Product {nbr_pid}"),
            "category":      prod_cats.get(nbr_pid, ""),
            "similarity":    sim,
            "similarityPct": round(sim * 100, 1),
        })
    knn_recs.append({
        "productId":   pid,
        "productName": prod_names.get(pid, f"Product {pid}"),
        "category":    prod_cats.get(pid, ""),
        "neighbours":  nbrs,
    })

stats = {
    "k":                      K - 1,
    "metric":                 "cosine",
    "totalProducts":          len(all_pids),
    "matrixShape":            f"{pivot.shape[0]} × {pivot.shape[1]}",
    "matrixProducts":         pivot.shape[0],
    "matrixCustomers":        pivot.shape[1],
    "precisionAt5":           avg_precision,
    "precisionAt5Pct":        round(avg_precision * 100, 2),
    "intralistSimilarity":    avg_ils,
    "intralistSimilarityPct": round(avg_ils * 100, 2),
    "coverage":               round(len(all_pids) / len(products), 4),
    "coveragePct":            round(len(all_pids) / len(products) * 100, 2),
}

output = {
    "generatedAt":   pd.Timestamp.now().isoformat(),
    "stats":         stats,
    "recommendations": knn_recs,
}

with open(OUTPUT_JSON, "w") as f:
    json.dump(output, f, indent=2)

print(f"  Precision@5={avg_precision} | ILS={avg_ils} | Coverage={stats['coveragePct']}%")
print(f"\n✅ KNN results saved to {OUTPUT_JSON}")
