import React from 'react';
import { useSignalStore } from '../../../stores/useSignalStore';
import { useControlPanelStore } from '../../../stores/useControlPanelStore';

const DisplayCursor = () => {
    const { cursor, signalList } = useSignalStore();
    const { controlPanelData } = useControlPanelStore();

    if (!cursor.active) return null;

    const { channelId, index } = cursor;
    const signal = signalList.find(s => s.id === channelId);

    if (!signal) return null;

    const { channels, timePerUnit, timeOffset, freqPerUnit, freqOffset, TotalSignalSamples, timeDomain } = controlPanelData;
    const channelConfig = channels.find(ch => ch.id === channelId);
    if (!channelConfig) return null;

    const { color } = channelConfig;

    // If channel is hidden, do we show cursor? Probably yes, or maybe not. 
    // Usually cursors are for measuring, so even if hidden, maybe? 
    // But data might not be visually there. Let's assume we show it if data exists.
    if (!channelConfig) return null;

    const isFreqDomain = !timeDomain;

    // Select correct units
    const voltsKey = isFreqDomain ? 'voltsPerUnitFreqDomain' : 'voltsPerUnitTimeDomain';
    const offsetKey = isFreqDomain ? 'offsetFreqDomain' : 'offsetTimeDomain';

    const voltsPerUnit = channelConfig[voltsKey] || 1;
    const offset = channelConfig[offsetKey] || 0;

    let x = 0;
    let y = 0;
    let isValid = false;

    if (isFreqDomain) {
        // Frequency Domain Logic
        const data = signal.frequencyData;
        if (data && index < data.length) {
            const point = data[index]; // [freq, mag]
            const currentFreqScale = freqPerUnit || 1;
            const currentFreqOffset = freqOffset || 0;

            // X = (Freq + Offset) / Scale
            x = (point[0] + currentFreqOffset) / currentFreqScale;
            // Y = 8 - (mag * 10 + offset) / voltsPerUnit
            y = 8 - ((point[1] * 10) + offset) / voltsPerUnit;
            isValid = true;
        }
    } else {
        // Time Domain Logic
        const data = signal.timeData;
        if (data && index < data.length) {
            const point = data[index]; // [time, volt]

            x = ((point[0] + (timeOffset || 0)) / timePerUnit);
            y = 4 - (point[1] + offset) / voltsPerUnit;
            isValid = true;
        }
    }

    if (!isValid) return null;

    // Render Crosshair
    // Vertical line (full height?) or small cross?
    // "2 crosses apears on the display and shows ontop of the selected dot"
    // I will render a crosshair (plus sign) at the location.
    // Size of cross
    const crossSize = 0.5; // in grid units

    return (
        <g className="cursor-group">
            {/* Vertical Line */}
            <line
                x1={x}
                y1={0}
                x2={x}
                y2={8}
                stroke="white"
                strokeWidth="0.02" // Skinny line
            />
            {/* Horizontal Line */}
            <line
                x1={0}
                y1={y}
                x2={10}
                y2={y}
                stroke="white"
                strokeWidth="0.02" // Skinny line
            />
        </g>
    );
};

export default DisplayCursor;

export const CursorOverlay = ({ widthUnits = 10 }) => {
    const { cursor, signalList, setCursorIndex } = useSignalStore();
    const { controlPanelData } = useControlPanelStore();
    const isDragging = React.useRef(false);
    const overlayRef = React.useRef(null);
    const { timePerUnit, timeOffset, freqPerUnit, freqOffset, timeDomain } = controlPanelData;
    const showFrequency = !timeDomain;

    if (!cursor.active) return null;

    const updateCursorFromPointer = (e) => {
        const overlay = overlayRef.current;
        if (!overlay) return;

        const rect = overlay.getBoundingClientRect();
        // Clamp x to within rect
        const xPixels = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const svgX = (xPixels / rect.width) * widthUnits;

        const signal = signalList.find(s => s.id === cursor.channelId);
        if (!signal) return;

        let newIndex = 0;

        if (showFrequency) {
            const data = signal.frequencyData;
            if (data && data.length > 0) {
                const currentFreqScale = freqPerUnit || 1;
                const currentFreqOffset = freqOffset || 0;
                const targetFreq = svgX * currentFreqScale - currentFreqOffset;

                let closestDist = Infinity;
                let closestIdx = 0;

                for (let i = 0; i < data.length; i++) {
                    const dist = Math.abs(data[i][0] - targetFreq);
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestIdx = i;
                    }
                }
                newIndex = closestIdx;
            }
        } else {
            const data = signal.timeData;
            if (data && data.length > 0) {
                const currentTimePerUnit = timePerUnit || 1;
                const currentTimeOffset = timeOffset || 0;
                const targetTime = svgX * currentTimePerUnit - currentTimeOffset;

                let closestDist = Infinity;
                let closestIdx = 0;
                for (let i = 0; i < data.length; i++) {
                    const dist = Math.abs(data[i][0] - targetTime);
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestIdx = i;
                    }
                }
                newIndex = closestIdx;
            }
        }

        setCursorIndex(newIndex);
    };

    const handlePointerDown = (e) => {
        const overlay = overlayRef.current;
        if (!overlay) return;

        const rect = overlay.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const svgX = (x / rect.width) * widthUnits;

        // Calculate current cursor X to see if we are close
        const signal = signalList.find(s => s.id === cursor.channelId);
        if (!signal) return;

        let cursorX = -1;
        const index = cursor.index;

        if (showFrequency) {
            const data = signal.frequencyData;
            if (data && index < data.length) {
                const point = data[index];
                const currentFreqScale = freqPerUnit || 1;
                const currentFreqOffset = freqOffset || 0;
                cursorX = (point[0] + currentFreqOffset) / currentFreqScale;
            }
        } else {
            const data = signal.timeData;
            if (data && index < data.length) {
                const point = data[index];
                const currentTimePerUnit = timePerUnit || 1;
                const currentTimeOffset = timeOffset || 0;
                cursorX = (point[0] + currentTimeOffset) / currentTimePerUnit;
            }
        }

        // Threshold of 1.0 units (as in original code)
        if (Math.abs(svgX - cursorX) < 1.0) {
            isDragging.current = true;
            e.target.setPointerCapture(e.pointerId);
            updateCursorFromPointer(e);
        }
    };

    const handlePointerMove = (e) => {
        if (!isDragging.current) return;
        updateCursorFromPointer(e);
    };

    const handlePointerUp = (e) => {
        if (isDragging.current) {
            isDragging.current = false;
            e.target.releasePointerCapture(e.pointerId);
        }
    };

    return (
        <div
            ref={overlayRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                cursor: 'ew-resize',
                touchAction: 'none'
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        />
    );
};

