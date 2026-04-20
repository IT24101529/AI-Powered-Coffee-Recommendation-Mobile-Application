# Implements the Fuzzy Logic System using scikit-fuzzy.
# Takes temperature (°C) and hour (0-23) as inputs.
# Outputs adjusted weight values for warmth and caffeine.

import numpy as np
import skfuzzy as fuzz
from skfuzzy import control as ctrl

# ── Step 8.A: Define Input and Output Universe of Discourse ─────
# The 'universe' is the range of possible values for each variable.

# Input 1: Temperature in Celsius (0 to 45°C range for Sri Lanka context)
temperature = ctrl.Antecedent(np.arange(0, 46, 1), 'temperature')

# Input 2: Hour of day (0 to 23)
hour = ctrl.Antecedent(np.arange(0, 24, 1), 'hour')

# Output 1: Warmth weight (0.0 to 1.0)
warmth_weight = ctrl.Consequent(np.arange(0, 1.01, 0.01), 'warmth_weight')

# Output 2: Caffeine weight (0.0 to 1.0)
caffeine_weight = ctrl.Consequent(np.arange(0, 1.01, 0.01), 'caffeine_weight')


# ── Step 8.B: Define Fuzzy Membership Functions ──────────────────
# Each line defines a fuzzy set using a triangular or trapezoidal shape.
# fuzz.trimf = triangular (3 points): [left_edge, peak, right_edge]
# fuzz.trapmf = trapezoidal (4 points): [left_foot, left_peak, right_peak, right_foot]

# Temperature membership functions
temperature['cold']  = fuzz.trapmf(temperature.universe, [0,  0,  12, 18])
temperature['cool']  = fuzz.trimf( temperature.universe, [13, 18, 24])
temperature['warm']  = fuzz.trimf( temperature.universe, [21, 25, 29])
temperature['hot']   = fuzz.trapmf(temperature.universe, [27, 32, 45, 45])

# Hour membership functions
hour['late_night']  = fuzz.trapmf(hour.universe, [0,  0,  4,  6])
hour['morning']     = fuzz.trimf( hour.universe, [5,  9,  12])
hour['afternoon']   = fuzz.trimf( hour.universe, [11, 14, 17])
hour['evening']     = fuzz.trimf( hour.universe, [16, 19, 21])
hour['night']       = fuzz.trapmf(hour.universe, [20, 22, 23, 23])

# Warmth weight membership functions
warmth_weight['low']    = fuzz.trapmf(warmth_weight.universe, [0,    0,    0.15, 0.35])
warmth_weight['medium'] = fuzz.trimf( warmth_weight.universe, [0.25, 0.50, 0.75])
warmth_weight['high']   = fuzz.trapmf(warmth_weight.universe, [0.65, 0.85, 1.0,  1.0])

# Caffeine weight membership functions
caffeine_weight['low']    = fuzz.trapmf(caffeine_weight.universe, [0,    0,    0.15, 0.35])
caffeine_weight['medium'] = fuzz.trimf( caffeine_weight.universe, [0.25, 0.50, 0.75])
caffeine_weight['high']   = fuzz.trapmf(caffeine_weight.universe, [0.65, 0.85, 1.0,  1.0])


# ── Step 8.C: Define Fuzzy Rules ────────────────────────────────
# Format: ctrl.Rule(antecedent, consequent)
# Multiple antecedents use & (AND) or | (OR)

rules = [
    # Cold + any time → high warmth
    ctrl.Rule(temperature['cold'],                              warmth_weight['high']),
    ctrl.Rule(temperature['cold'],                              caffeine_weight['high']),

    # Cool + morning → high warmth, medium-high caffeine
    ctrl.Rule(temperature['cool'] & hour['morning'],            warmth_weight['high']),
    ctrl.Rule(temperature['cool'] & hour['morning'],            caffeine_weight['medium']),

    # Cool + afternoon/evening → medium warmth
    ctrl.Rule(temperature['cool'] & hour['afternoon'],          warmth_weight['medium']),
    ctrl.Rule(temperature['cool'] & hour['evening'],            warmth_weight['medium']),

    # Warm → medium warmth, medium caffeine
    ctrl.Rule(temperature['warm'],                              warmth_weight['medium']),
    ctrl.Rule(temperature['warm'],                              caffeine_weight['medium']),

    # Hot → low warmth, medium caffeine
    ctrl.Rule(temperature['hot'],                               warmth_weight['low']),
    ctrl.Rule(temperature['hot'],                               caffeine_weight['medium']),

    # Morning → higher caffeine (people need energy)
    ctrl.Rule(hour['morning'],                                  caffeine_weight['high']),

    # Evening/Night → lower caffeine
    ctrl.Rule(hour['evening'] | hour['night'],                  caffeine_weight['low']),

    # Late night → very low caffeine, medium warmth
    ctrl.Rule(hour['late_night'],                               caffeine_weight['low']),
    ctrl.Rule(hour['late_night'],                               warmth_weight['medium']),
]


# ── Step 8.D: Build the Control System ──────────────────────────
# ControlSystem packages the rules together
# ControlSystemSimulation is the object you give inputs to and get outputs from
_control_system   = ctrl.ControlSystem(rules)
_simulation       = ctrl.ControlSystemSimulation(_control_system)


def run_fuzzy(temp_celsius: float, current_hour: int) -> dict:
    '''
    Runs the fuzzy inference system and returns output weights.

    Args:
        temp_celsius   — raw temperature from weather API (e.g. 17.4)
        current_hour   — hour of day 0-23 (e.g. 8 for 8am)

    Returns dict with:
        warmth_weight   — float 0.0–1.0
        caffeine_weight — float 0.0–1.0
    '''
    # Clamp inputs to valid universe ranges to avoid errors
    temp_celsius   = max(0,  min(45, temp_celsius))
    current_hour   = max(0,  min(23, current_hour))

    try:
        # Set the inputs
        _simulation.input['temperature'] = temp_celsius
        _simulation.input['hour']        = current_hour

        # Run the fuzzy inference
        _simulation.compute()

        # Get defuzzified output values
        warmth   = round(float(_simulation.output['warmth_weight']),   3)
        caffeine = round(float(_simulation.output['caffeine_weight']), 3)

        print(f'[FuzzyEngine] temp={temp_celsius}°C, hour={current_hour}h → warmth={warmth}, caffeine={caffeine}')
        return {'warmth_weight': warmth, 'caffeine_weight': caffeine}

    except Exception as e:
        print(f'[FuzzyEngine] Error during compute: {e}. Using defaults.')
        # Return neutral values on error
        return {'warmth_weight': 0.5, 'caffeine_weight': 0.5}


# ── Test directly ─────────────────────────────────────────────────
if __name__ == '__main__':
    test_cases = [
        (17.4, 8,  'Cool Rainy Morning'),
        (31.0, 14, 'Hot Sunny Afternoon'),
        (13.0, 7,  'Cold Morning'),
        (24.0, 20, 'Warm Evening'),
        (20.0, 2,  'Cool Late Night'),
    ]
    print('Fuzzy Logic output tests:')
    for temp, hour_val, label in test_cases:
        result = run_fuzzy(temp, hour_val)
        print(f'  [{label}] warmth={result["warmth_weight"]}, caffeine={result["caffeine_weight"]}')