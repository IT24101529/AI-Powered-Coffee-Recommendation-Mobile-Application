import pandas as pd
from mlxtend.frequent_patterns import apriori, association_rules
from mlxtend.preprocessing import TransactionEncoder
from sales_logger import get_sessions_with_products

# Minimum thresholds — tune these based on your data size
MIN_SUPPORT    = 0.05   # Item pair must appear in at least 5% of sessions
MIN_CONFIDENCE = 0.30   # If A is bought, B must follow at least 30% of the time
MIN_LIFT       = 1.0    # Only keep rules where B is MORE likely given A


def run_apriori(db) -> list:
    '''
    Runs the Apriori algorithm on all sessions in the database.
    Returns a list of association rules (product pairs with confidence scores).
    '''
    # Step 1: Get sessions as lists of products
    sessions = get_sessions_with_products(db)   # dict: {session_id: [products]},
    transactions = list(sessions.values())      # list of lists

    if len(transactions) < 5:
        print('[Apriori] Not enough data yet (need at least 5 sessions).')
        return []

    # Step 2: Encode transactions into a True/False matrix
    # TransactionEncoder turns e.g. ['Espresso', 'Muffin'] into
    # a row of True/False for every possible product
    te = TransactionEncoder()
    te_array = te.fit(transactions).transform(transactions)
    df = pd.DataFrame(te_array, columns=te.columns_)

    # Step 3: Find frequent itemsets (groups that appear often enough)
    frequent_itemsets = apriori(
        df,
        min_support=MIN_SUPPORT,
        use_colnames=True   # Use product names instead of column indices
    )

    if frequent_itemsets.empty:
        print('[Apriori] No frequent itemsets found. Try lowering MIN_SUPPORT.')
        return []

    # Step 4: Generate association rules from the itemsets
    rules = association_rules(
        frequent_itemsets,
        metric='confidence',
        min_threshold=MIN_CONFIDENCE
    )

    # Step 5: Filter by lift (only keep genuine patterns)
    rules = rules[rules['lift'] >= MIN_LIFT]

    # Step 6: Convert to a clean list of dicts
    result = []
    for _, row in rules.iterrows():
        antecedent = list(row['antecedents'])[0]   # The 'if bought' product
        consequent = list(row['consequents'])[0]   # The 'also buy' product
        result.append({
            'if_bought':  antecedent,
            'also_buy':   consequent,
            'confidence': round(float(row['confidence']), 3),
            'support':    round(float(row['support']), 3),
            'lift':       round(float(row['lift']), 3),
        })

    # Sort by confidence (strongest rules first)
    result.sort(key=lambda x: x['confidence'], reverse=True)
    print(f'[Apriori] Found {len(result)} association rules.')
    return result


def get_product_pairs(db, product_name: str) -> list:
    '''
    Returns the top products frequently bought with the given product.
    This is what Wijerathna calls after a user orders something.
    '''
    all_rules = run_apriori(db)

    # Filter rules where the 'if_bought' product matches the query
    pairs = [
        {
            'product':    r['also_buy'],
            'confidence': r['confidence'],
            'message':    f"{int(r['confidence']*100)}% of people who order {product_name} also get {r['also_buy']}!",
        }
        for r in all_rules
        if r['if_bought'].lower() == product_name.lower()
    ]

    return pairs[:3]   # Return top 3 pairs only
