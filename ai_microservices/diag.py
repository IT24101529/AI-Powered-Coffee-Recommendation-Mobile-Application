import sys
import os

print(f"Python Executable: {sys.executable}")
print(f"Python Version: {sys.version}")
print(f"CWD: {os.getcwd()}")
print("--- sys.path ---")
for p in sys.path:
    print(p)

print("\n--- Testing Imports ---")
try:
    import fastapi
    print("fastapi: OK")
except ImportError as e:
    print(f"fastapi: FAIL ({e})")

try:
    import nltk
    print("nltk: OK")
except ImportError as e:
    print(f"nltk: FAIL ({e})")

try:
    import scipy
    print("scipy: OK")
except ImportError as e:
    print(f"scipy: FAIL ({e})")

try:
    import packaging
    print("packaging: OK")
except ImportError as e:
    print(f"packaging: FAIL ({e})")
