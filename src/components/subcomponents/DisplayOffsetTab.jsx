import React, { useState, useEffect, useRef, useCallback } from 'react';

const DisplayOffsetTab = ({ channel, onUpdate }) => {
    const { id, offset, voltsPerUnit, color, visible } = channel;
    const [isDragging, setIsDragging] = useState(false);

    // We need a ref to track the last sent offset to avoid flooding updates
    const lastSentOffsetRef = useRef(offset);

    // If channel not visible, don't render
    if (!visible) return null;

    // --- Calculations ---
    const maxOffset = 4 * voltsPerUnit;
    const minOffset = -4 * voltsPerUnit;

    // Visual Clamp State
    let isClampedUp = false;
    let isClampedDown = false;
    let displayOffset = offset;

    if (offset > maxOffset) {
        isClampedUp = true;
        displayOffset = maxOffset;
    } else if (offset < minOffset) {
        isClampedDown = true;
        displayOffset = minOffset;
    }

    const zeroPosUnits = 4 - (displayOffset / voltsPerUnit);
    const topPercent = (zeroPosUnits / 8) * 100;

    // --- Drag Logic ---
    const handleMouseDown = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);

        const startY = e.clientY;
        const startOffset = offset;
        lastSentOffsetRef.current = offset; // Sync

        const container = e.target.offsetParent; // The sidebar div
        if (!container) return;
        const containerHeight = container.clientHeight;

        const handleMouseMove = (moveEvent) => {
            // 1. Calculate raw movement
            const dy = moveEvent.clientY - startY;

            // 2. Convert to Units (0-8 range for full height)
            const deltaUnits = (dy / containerHeight) * 8;

            // 3. Convert to Volts (Standard Oscilloscope Y-axis direction)
            // Move Mouse DOWN (+dy) -> Move Signal DOWN -> Decrease Offset
            // NOTE: In our math `y = 4 - (offset/scale)`. 
            // If dragging the TAB down, we want the TAB to follow mouse.
            // If Tab y increases (down), `zeroPosUnits` increases.
            // `zeroPosUnits` increases -> `4 - (offset/scale)` increases -> `offset` DECREASES.
            // So +dy = -dOffset. Correct.
            const deltaVolts = -deltaUnits * voltsPerUnit;

            let rawNewOffset = startOffset + deltaVolts;

            // 4. Snap to 0.1x Grid
            const step = 0.1 * voltsPerUnit;
            let snappedOffset = Math.round(rawNewOffset / step) * step;

            // 5. Clamp
            snappedOffset = Math.min(Math.max(snappedOffset, minOffset), maxOffset);

            // 6. Hysteresis / Throttling: Only update if value CHANGED diff from last update
            // Floating point comparison epsilon
            if (Math.abs(snappedOffset - lastSentOffsetRef.current) > 1e-9) {
                lastSentOffsetRef.current = snappedOffset;
                onUpdate({ offset: snappedOffset });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }, [offset, voltsPerUnit, onUpdate, minOffset, maxOffset]);

    // --- Styles ---
    const pointerSize = 6;
    const tabHeight = 16;
    const tabWidth = 35;

    let pointerStyle = {};
    if (isClampedUp) {
        pointerStyle = {
            left: '50%',
            top: '-6px',
            marginLeft: `-${pointerSize}px`,
            borderLeft: `${pointerSize}px solid transparent`,
            borderRight: `${pointerSize}px solid transparent`,
            borderBottom: `${pointerSize}px solid ${color}`
        };
    } else if (isClampedDown) {
        pointerStyle = {
            left: '50%',
            bottom: '-6px',
            marginLeft: `-${pointerSize}px`,
            borderLeft: `${pointerSize}px solid transparent`,
            borderRight: `${pointerSize}px solid transparent`,
            borderTop: `${pointerSize}px solid ${color}`
        };
    } else {
        pointerStyle = {
            right: '-6px',
            top: '50%',
            marginTop: `-${pointerSize}px`,
            borderTop: `${pointerSize}px solid transparent`,
            borderBottom: `${pointerSize}px solid transparent`,
            borderLeft: `${pointerSize}px solid ${color}`
        };
    }

    return (
        <div
            onMouseDown={handleMouseDown}
            style={{
                position: 'absolute',
                top: `${topPercent}%`,
                left: '4px',
                width: `${tabWidth}px`,
                height: `${tabHeight}px`,
                transform: 'translateY(-50%)',
                backgroundColor: color,
                borderRadius: '3px',
                cursor: 'ns-resize',
                zIndex: isDragging ? 20 : 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '1px 1px 3px rgba(0,0,0,0.5)',
                userSelect: 'none'
            }}
            title={`Ch${id + 1} Offset: ${offset.toPrecision(3)}V`}
        >
            <span style={{
                color: 'black',
                fontSize: '10px',
                fontWeight: '800',
                lineHeight: '1',
                pointerEvents: 'none'
            }}>
                Ch{id + 1}
            </span>

            <div
                style={{
                    position: 'absolute',
                    width: 0,
                    height: 0,
                    ...pointerStyle
                }}
            />
        </div>
    );
};

export default DisplayOffsetTab;
