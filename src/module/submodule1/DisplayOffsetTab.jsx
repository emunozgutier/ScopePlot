import React, { useState, useEffect, useRef, useCallback } from 'react';

const DisplayOffsetTab = ({ channel, onUpdate, isFreqDomain }) => {
    const { id, color, visible } = channel;

    // Select correct keys
    const voltsKey = isFreqDomain ? 'voltsPerUnitFreqDomain' : 'voltsPerUnitTimeDomain';
    const offsetKey = isFreqDomain ? 'offsetFreqDomain' : 'offsetTimeDomain';

    const voltsPerUnit = channel[voltsKey] || 1;
    const offset = channel[offsetKey] || 0;

    const [isDragging, setIsDragging] = useState(false);

    // Internal height tracking to replace parent prop
    const tabRef = useRef(null);
    const [containerHeight, setContainerHeight] = useState(0);

    useEffect(() => {
        const updateHeight = () => {
            if (tabRef.current && tabRef.current.offsetParent) {
                setContainerHeight(tabRef.current.offsetParent.clientHeight);
            }
        };

        // Run initially and on resize
        updateHeight();
        window.addEventListener('resize', updateHeight);

        return () => window.removeEventListener('resize', updateHeight);
    }, []);

    // We need a ref to track the last sent offset to avoid flooding updates
    const lastSentOffsetRef = useRef(offset);

    // Keep ref in sync on render (except when dragging, to avoid jitter? No, usually fine)
    // Actually, if we are dragging, we don't want external updates to jump us, 
    // but here we are producing the updates.
    // Let's just update the ref when not dragging?
    if (!isDragging) {
        lastSentOffsetRef.current = offset;
    }

    // --- Calculations ---
    const maxOffset = 4 * voltsPerUnit;
    const minOffset = -4 * voltsPerUnit;

    // --- Drag Logic ---
    const handleMouseDown = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);

        const startY = e.clientY;
        const startOffset = offset; // Capture current prop value

        // Use the tracked containerHeight, fallback to calculated if 0 (e.g. first render quirk)
        const currentHeight = containerHeight || e.target.offsetParent?.clientHeight || 600;

        const handleMouseMove = (moveEvent) => {
            // 1. Calculate raw movement
            const dy = moveEvent.clientY - startY;

            // 2. Convert to Units (0-8 range for full height)
            const deltaUnits = (dy / currentHeight) * 8;

            // 3. Convert to Volts (Standard Oscilloscope Y-axis direction)
            // Move Mouse DOWN (+dy) -> Move Signal DOWN -> Decrease Offset
            const deltaVolts = -deltaUnits * voltsPerUnit;

            let rawNewOffset = startOffset + deltaVolts;

            // 4. Snap to 0.1x Grid
            const step = 0.1 * voltsPerUnit;
            let snappedOffset = Math.round(rawNewOffset / step) * step;

            // 5. Clamp
            snappedOffset = Math.min(Math.max(snappedOffset, minOffset), maxOffset);

            // 6. Hysteresis / Throttling: Only update if value CHANGED diff from last update
            if (Math.abs(snappedOffset - lastSentOffsetRef.current) > 1e-9) {
                lastSentOffsetRef.current = snappedOffset;
                onUpdate({ [offsetKey]: snappedOffset });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }, [offset, voltsPerUnit, onUpdate, minOffset, maxOffset, containerHeight, offsetKey]);

    // If channel not visible, don't render. 
    // MOVED AFTER HOOKS
    if (!visible) return null;

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

    const baseline = isFreqDomain ? 8 : 4;
    const zeroPosUnits = baseline - (displayOffset / voltsPerUnit);
    const topPercent = (zeroPosUnits / 8) * 100;

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
            ref={tabRef}
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
