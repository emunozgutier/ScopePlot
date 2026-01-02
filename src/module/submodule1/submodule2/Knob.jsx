import React, { useRef, useEffect, useState } from 'react';

// Generate 1-2-5 steps from 1p (1e-12) to 1T (1e12)
const generateSteps = () => {
    const steps = [];
    for (let exp = -12; exp <= 12; exp++) {
        steps.push(1 * Math.pow(10, exp));
        if (exp < 12) {
            steps.push(2 * Math.pow(10, exp));
            steps.push(5 * Math.pow(10, exp));
        }
    }
    // Fix floating point issues
    return steps.map(s => parseFloat(s.toPrecision(1))).sort((a, b) => a - b);
};

const STEPS_1_2_5 = generateSteps();

// Generate Power of 2 steps from 2^4 (16) to 2^17 (131072)
const generatePowerOf2Steps = () => {
    const steps = [];
    for (let exp = 4; exp <= 17; exp++) {
        steps.push(Math.pow(2, exp));
    }
    return steps;
};
const STEPS_POWER_OF_2 = generatePowerOf2Steps();

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
    stepType = 'linear', // 'linear', '1-2-5', or 'powerOf2'
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

    // Helper to find nearest Power of 2 step
    const getNearestPowerOf2 = (val) => {
        if (val <= STEPS_POWER_OF_2[0]) return STEPS_POWER_OF_2[0];
        if (val >= STEPS_POWER_OF_2[STEPS_POWER_OF_2.length - 1]) return STEPS_POWER_OF_2[STEPS_POWER_OF_2.length - 1];

        return STEPS_POWER_OF_2.reduce((prev, curr) => {
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

                // Clamp index to array bounds
                if (newIndex < 0) newIndex = 0;
                if (newIndex >= STEPS_1_2_5.length) newIndex = STEPS_1_2_5.length - 1;

                // Clamp value to min/max props
                let nextValue = STEPS_1_2_5[newIndex];
                if (nextValue > max || nextValue < min) {
                    newValue = currentVal; // No change
                } else {
                    newValue = nextValue;
                }
            } else if (stepType === 'powerOf2') {
                const current = getNearestPowerOf2(currentVal);
                const currentIndex = STEPS_POWER_OF_2.indexOf(current);
                let newIndex = currentIndex + direction;
                if (newIndex < 0) newIndex = 0;
                if (newIndex >= STEPS_POWER_OF_2.length) newIndex = STEPS_POWER_OF_2.length - 1;
                newValue = STEPS_POWER_OF_2[newIndex];
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
    } else if (stepType === 'powerOf2') {
        const current = getNearestPowerOf2(value);
        const currentIndex = STEPS_POWER_OF_2.indexOf(current);
        const totalSteps = STEPS_POWER_OF_2.length;
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
        const newVal = parseValue(inputValue);

        // Validation/Snapping logic similar to wheel
        let finalVal = newVal;

        if (stepType === '1-2-5') {
            finalVal = getNearest125(newVal);
            // Clamp to allowed range
            if (finalVal < min) finalVal = min; // Or find nearest 1-2-5 >= min
            // Let's just use the nearest found relative to min/max
            if (finalVal > max) finalVal = max; // Clamp
        } else if (stepType === 'powerOf2') {
            finalVal = getNearestPowerOf2(newVal);
            // Clamp
            // PowerOf2 steps are fixed, but we should respect min/max if possible
            // Current logic matches steps mainly.
        } else {
            // Linear
            finalVal = Math.min(Math.max(newVal, min), max);
        }

        if (!isNaN(finalVal) && finalVal !== value) {
            onChange(finalVal);
        } else {
            // Reset if invalid or same
            setInputValue(format ? format(value) : value.toString());
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.target.blur();
        }
    };

    // Dragging Logic
    useEffect(() => {
        const el = knobRef.current;
        if (!el) return;

        let startY = 0;
        let startVal = 0;
        let accumulatedDelta = 0;

        const handleMouseMove = (e) => {
            const currentY = e.clientY;
            let deltaY = startY - currentY; // Up is positive

            // Sensitivity
            const PIXELS_PER_STEP = 20;

            if (stepType === 'linear') {
                // Continuous mapping
                // Map 200px to full range? Or 1 step per 10px?
                let change = (deltaY / PIXELS_PER_STEP) * step;
                let newVal = startVal + change;
                newVal = Math.min(Math.max(newVal, min), max);
                onChangeRef.current(parseFloat(newVal.toFixed(6)));
            } else {
                // Discrete mapping
                accumulatedDelta = deltaY;
                const stepsToTake = Math.round(accumulatedDelta / PIXELS_PER_STEP);

                if (stepsToTake !== 0) {
                    // Determine direction
                    const direction = stepsToTake > 0 ? 1 : -1;
                    const absSteps = Math.abs(stepsToTake);

                    let current = startVal;
                    // We need to apply logic relative to startVal
                    // Actually easier: calculate 'newIndex' based on start index + stepsToTake

                    if (stepType === '1-2-5') {
                        const snappedStart = getNearest125(startVal);
                        const startIdx = STEPS_1_2_5.indexOf(snappedStart);
                        let newIdx = startIdx + stepsToTake;
                        if (newIdx < 0) newIdx = 0;
                        if (newIdx >= STEPS_1_2_5.length) newIdx = STEPS_1_2_5.length - 1;

                        let nextVal = STEPS_1_2_5[newIdx];
                        if (nextVal >= min && nextVal <= max) {
                            onChangeRef.current(nextVal);
                        }
                    } else if (stepType === 'powerOf2') {
                        const snappedStart = getNearestPowerOf2(startVal);
                        const startIdx = STEPS_POWER_OF_2.indexOf(snappedStart);
                        let newIdx = startIdx + stepsToTake;
                        if (newIdx < 0) newIdx = 0;
                        if (newIdx >= STEPS_POWER_OF_2.length) newIdx = STEPS_POWER_OF_2.length - 1;
                        onChangeRef.current(STEPS_POWER_OF_2[newIdx]);
                    }
                }
            }
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
        };

        const handleMouseDown = (e) => {
            // Only left click
            if (e.button !== 0) return;
            e.preventDefault();
            startY = e.clientY;
            startVal = valueRef.current;
            accumulatedDelta = 0;

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'ns-resize';
        };

        el.addEventListener('mousedown', handleMouseDown);
        return () => {
            el.removeEventListener('mousedown', handleMouseDown);
            // Cleanup in case component unmounts while dragging
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
        }
    }, [stepType, min, max, step]);

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
