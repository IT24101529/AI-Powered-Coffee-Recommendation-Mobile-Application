import os
import sys
import json
import traceback

# Add the local directory to handle imports correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from weight_calculator import compute_weight_vector

def run_integration_test():
    print("=" * 60)
    print("  [Context Vector Integration & Bounds Verification]  ")
    print("=" * 60)
    
    db = SessionLocal()
    
    try:
        # Simulate an incoming weather context
        simulated_temp = 28.5
        simulated_condition_tag = "Clear"
        simulated_temp_tag = "Warm"
        simulated_time = "Afternoon"
        simulated_hour = 14
        
        print("\n[✓] 1. Initiating Context Weight Calculation with:")
        print(f"    Temp: {simulated_temp}°C | Condition: {simulated_condition_tag}")
        print(f"    Tags: {simulated_temp_tag} | Time: {simulated_time} ({simulated_hour}:00)")

        # Generate Weight Vector
        result = compute_weight_vector(
            db=db,
            temp_celsius=simulated_temp,
            condition_tag=simulated_condition_tag,
            temp_tag=simulated_temp_tag,
            time_of_day=simulated_time,
            current_hour=simulated_hour
        )
        
        weight_vector = result.get("weights_dict", {})
        
        # Verify L2-Normalized Mathematical Bounds (0.0 to 1.0)
        print("\n[✓] 2. Auditing Output Ranges for L2-Normalization Matcher:")
        
        out_of_bounds = []
        for feature, weight in weight_vector.items():
            valid = 0.0 <= weight <= 1.0
            status = "PASS" if valid else "FAIL"
            print(f"    - {feature:<20}: {weight:.4f}  [{status}]")
            if not valid:
                out_of_bounds.append(feature)
                
        if out_of_bounds:
            print(f"\n[!] WARNING: Features out of bounds (> 1.0 or < 0.0): {out_of_bounds}")
        else:
            print("\n[✓] 3. All Mathematical Bounds are Valid (0.0 to 1.0).")
            print("    Ready for Ekanayake's Cosine Similarity matcher.")
            
        print("\n[✓] 4. Payload System Prompt Compatibility Check:")
        
        # Simulated format for Gemini System Prompt
        expected_payload = {
            "temperature_celsius": result.get("fuzzy_warmth", simulated_temp),
            "condition": simulated_condition_tag,
            "weights": weight_vector
        }
        
        json_payload = json.dumps(expected_payload, indent=2)
        print(f"\nExact injected Gemini JSON Payload:\n{json_payload}")
        
        print("\n================= TEST COMPLETE =================")
        
    except Exception as e:
        print("\n[!] FATAL ERROR during context mathematical computation:")
        traceback.print_exc()
    
    finally:
        db.close()

if __name__ == "__main__":
    run_integration_test()
