import React, { useRef, useEffect, useState } from 'react';

const STEPS_1_2_5 = [
    0.001, 0.002, 0.005,
    0.01, 0.02, 0.05,
    0.1, 0.2, 0.5,
    1, 2, 5,
    10, 20, 50,
    100
];

const Knob = ({
    value,
    onChange,
    label,
    min = 0,
    max = 100,
    stepType = 'linear', // 'linear' or '1-2-5'
    step = 1,
    color = 'white'
}) => {
    const knobRef = useRef(null);
    const valueRef = useRef(value);
    const [isHovered, setIsHovered] = useState(false);

    // Keep ref in sync
    useEffect(() => {
        valueRef.current = value;
    }, [value]);

    // Helper to find nearest 1-2-5 step
    const getNearest125 = (val) => {
        // Clamp val to min/max of array to avoid issues
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
                newValue = Math.min(Math.max(newValue, min), max);
            }

            // Floating point fix for linear
            if (stepType === 'linear') {
                newValue = parseFloat(newValue.toFixed(2));
            }

            onChange(newValue);
        };

        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => el.removeEventListener('wheel', handleWheel);
    }, [stepType, min, max, step, onChange]); // Dependencies that rarely change

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
        const percent = (value - min) / range;
        angle = MIN_ANGLE + (percent * (MAX_ANGLE - MIN_ANGLE));
    }

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
                type="number"
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                step={stepType === '1-2-5' ? null : step}
                style={{
                    width: '40px',
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
