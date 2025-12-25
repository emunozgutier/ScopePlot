import React, { useRef, useEffect, useState } from 'react';

// Generate 1-2-5 steps from 1uV (1e-6) to 100V
const generateSteps = () => {
    const steps = [];
    for (let exp = -6; exp <= 2; exp++) {
        steps.push(1 * Math.pow(10, exp));
        if (exp < 2) { // Don't go beyond 100
            steps.push(2 * Math.pow(10, exp));
            steps.push(5 * Math.pow(10, exp));
        }
    }
    // Fix floating point issues
    return steps.map(s => parseFloat(s.toPrecision(1))).sort((a, b) => a - b);
};

const STEPS_1_2_5 = generateSteps();

const parseValue = (valStr) => {
    if (!valStr) return 0;
    const str = valStr.toString().trim().toLowerCase();
    let multiplier = 1;
    if (str.endsWith('u') || str.endsWith('uv')) multiplier = 1e-6;
    else if (str.endsWith('m') || str.endsWith('mv')) multiplier = 1e-3;
    else if (str.endsWith('k') || str.endsWith('kv')) multiplier = 1e3;

    const num = parseFloat(str);
    if (isNaN(num)) return 0;
    return num * multiplier;
};

const Knob = ({
    value,
    onChange,
    label,
    min = 0,
    max = 100,
    stepType = 'linear', // 'linear' or '1-2-5'
    step = 1,
    color = 'white',
    format // Optional formatter function
}) => {
    const knobRef = useRef(null);
    const valueRef = useRef(value);
    const onChangeRef = useRef(onChange); // Stable ref for callback
    const [isHovered, setIsHovered] = useState(false);

    // Internal state for input to allow typing
    const [inputValue, setInputValue] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    // Keep refs in sync
    useEffect(() => {
        valueRef.current = value;
        onChangeRef.current = onChange; // Update ref
        if (!isEditing) {
            setInputValue(format ? format(value) : value.toString());
        }
    }, [value, onChange, format, isEditing]);

    // Helper to find nearest 1-2-5 step
    const getNearest125 = (val) => {
        // Clamp val to min/max of array
        if (val <= STEPS_1_2_5[0]) return STEPS_1_2_5[0];
        if (val >= STEPS_1_2_5[STEPS_1_2_5.length - 1]) return STEPS_1_2_5[STEPS_1_2_5.length - 1];

        return STEPS_1_2_5.reduce((prev, curr) => {
            return (Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev);
        });
    };

    useEffect(() => {
        const el = knobRef.current;
        if (!el) return;

        const handleWheel = (e) => {
            e.preventDefault();
            const currentVal = valueRef.current;
            const direction = e.deltaY > 0 ? -1 : 1;

            let newValue;
            if (stepType === '1-2-5') {
                const current = getNearest125(currentVal);
                const currentIndex = STEPS_1_2_5.indexOf(current);
                let newIndex = currentIndex + direction;
                if (newIndex < 0) newIndex = 0;
                if (newIndex >= STEPS_1_2_5.length) newIndex = STEPS_1_2_5.length - 1;
                newValue = STEPS_1_2_5[newIndex];
            } else {
                newValue = currentVal + (direction * step);
                // Clamp logic: if current is out of bounds, allow moving back in, but clamp strictly once met
                // Actually user requested: "leave it as is but once you update... cap it".
                // Simple clamp is safest for generic knob. Logic for "leave as is" is best handled by finding valid range.
                newValue = Math.min(Math.max(newValue, min), max);
            }

            // Floating point fix for linear
            if (stepType === 'linear') {
                newValue = parseFloat(newValue.toFixed(6)); // Higher precision for small steps
            }

            // Call latest callback via ref
            if (onChangeRef.current) {
                onChangeRef.current(newValue);
            }
        };

        // Passive false is important for preventing default scroll
        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => el.removeEventListener('wheel', handleWheel);
    }, [stepType, min, max, step]); // Remove onChange from deps!

    // Angle Calculation
    let angle = 0;
    const MIN_ANGLE = -135;
    const MAX_ANGLE = 135;

    if (stepType === '1-2-5') {
        const current = getNearest125(value);
        const currentIndex = STEPS_1_2_5.indexOf(current);
        const totalSteps = STEPS_1_2_5.length;
        const percent = currentIndex / (totalSteps - 1);
        angle = MIN_ANGLE + (percent * (MAX_ANGLE - MIN_ANGLE));
    } else {
        // Linear
        const range = max - min;
        // Avoid division by zero
        if (range === 0) angle = MIN_ANGLE;
        else {
            // Handle values outside range gracefully for visualization
            const clampedVal = Math.min(Math.max(value, min), max);
            const percent = (clampedVal - min) / range;
            angle = MIN_ANGLE + (percent * (MAX_ANGLE - MIN_ANGLE));
        }
    }

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    const handleInputBlur = () => {
        setIsEditing(false);
        const parsed = parseValue(inputValue);
        if (!isNaN(parsed)) {
            // For 1-2-5, snap to nearest? Or allow free entry? 
            // Usually scopes allow free entry or snap. Let's snap if 1-2-5.
            let finalVal = parsed;
            if (stepType === '1-2-5') {
                finalVal = getNearest125(parsed);
            } else {
                finalVal = Math.min(Math.max(parsed, min), max);
            }
            onChange(finalVal);
            setInputValue(format ? format(finalVal) : finalVal.toString());
        } else {
            // Revert
            setInputValue(format ? format(value) : value.toString());
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.target.blur();
        }
    };

    return (
        <div className="knob-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 5px' }}>
            <label style={{ fontSize: '10px', marginBottom: '2px', color }}>{label}</label>

            <div
                ref={knobRef}
                className="knob-circle"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: `2px solid ${color}`,
                    position: 'relative',
                    cursor: 'ns-resize',
                    transform: `rotate(${angle}deg)`,
                    transition: 'transform 0.1s ease-out',
                    boxShadow: isHovered ? `0 0 8px ${color}` : 'none'
                }}
                title="Scroll"
            >
                <div
                    className="knob-marker"
                    style={{
                        position: 'absolute',
                        top: '0',
                        left: '50%',
                        width: '2px',
                        height: '50%',
                        backgroundColor: color,
                        transform: 'translateX(-50%)',
                        transformOrigin: 'bottom center'
                    }}
                />
            </div>

            <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onFocus={() => setIsEditing(true)}
                onBlur={handleInputBlur}
                onKeyDown={handleKeyDown}
                step={stepType === '1-2-5' ? null : step}
                style={{
                    width: '50px',
                    marginTop: '5px',
                    fontSize: '10px',
                    textAlign: 'center',
                    background: 'transparent',
                    color: 'white',
                    border: 'none',
                    borderBottom: '1px solid #555'
                }}
            />
        </div>
    );
};

export default Knob;
