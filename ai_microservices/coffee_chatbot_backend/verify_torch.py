import os
import sys

# Add the current directory to path to reach semantic_retriever
sys.path.append(os.getcwd())

try:
    print("--- Verifying AI Dependencies ---")
    import torch
    print(f"Torch Version: {torch.__version__}")
    from sentence_transformers import SentenceTransformer
    print("Sentence Transformers imported successfully.")
    
    # Try importing the local module
    from semantic_retriever import semantic_search
    print("semantic_retriever.py imported successfully.")
    
    print("SUCCESS: RAG module should now work without ModuleNotFoundError.")
except ImportError as e:
    print(f"FAILURE: {e}")
except Exception as e:
    print(f"Unexpected error: {e}")
