import React, { useEffect, useRef } from 'react';
import DisplaySignal from './submodule2/DisplaySignal';
import DisplayCursor from './submodule2/DisplayCursor';
import DisplayLabel from './submodule2/DisplayLabel';
import { useControlPanelStore } from '../../stores/useControlPanelStore';
import { useSignalStore } from '../../stores/useSignalStore';

const DisplayGraph = () => {
    const { controlPanelData } = useControlPanelStore();
    const { signalList, cursor, setCursorIndex, labels, labelToolActive, addLabel } = useSignalStore();

    const svgRef = useRef(null);
    const isDragging = useRef(false);

    const widthUnits = 10;
    const heightUnits = 8;
    const showFrequency = !controlPanelData.timeDomain;

    const handlePointerDown = (e) => {
        const svg = svgRef.current;
        if (!svg) return;

        if (labelToolActive) {
            const rect = svg.getBoundingClientRect();
            const xPixels = e.clientX - rect.left;
            const yPixels = e.clientY - rect.top;
            const svgX = (xPixels / rect.width) * widthUnits;
            const svgY = (yPixels / rect.height) * heightUnits;

            // Find closest signal point
            let closestDist = Infinity;
            let closestPoint = null;
            let closestChannelId = null;

            controlPanelData.channels.forEach(ch => {
                if (!ch.visible) return;
                const sig = signalList.find(s => s.id === ch.id);
                if (!sig) return;

                const data = showFrequency ? sig.frequencyData : sig.timeData;
                if (!data) return;

                const scale = showFrequency ? (controlPanelData.freqPerUnit || 1) : (controlPanelData.timePerUnit || 1);
                const offset = showFrequency ? (controlPanelData.freqOffset || 0) : (controlPanelData.timeOffset || 0);
                const targetVal = svgX * scale - offset;

                // Find closest index by X
                let idx = 0;
                let minXDist = Infinity;
                for (let i = 0; i < data.length; i++) {
                    const d = Math.abs(data[i][0] - targetVal);
                    if (d < minXDist) { minXDist = d; idx = i; }
                }

                // Check Y distance in screen units
                const point = data[idx];
                // Y Calc
                const voltsPerUnit = showFrequency ? (ch.voltsPerUnitFreqDomain || 1) : ch.voltsPerUnitTimeDomain;
                const chOffset = showFrequency ? (ch.offsetFreqDomain || 0) : ch.offsetTimeDomain; // Note: simplified logic, usually ch has own offset

                // My DisplayCursor logic for Y:
                // Time: y = 4 - (val + offset)/scale
                // Freq: y = 8 - (val*10 + offset)/scale

                let pointSvgY;
                if (showFrequency) {
                    pointSvgY = 8 - ((point[1] * 10) + (ch.offsetFreqDomain || 0)) / (ch.voltsPerUnitFreqDomain || 1);
                } else {
                    pointSvgY = 4 - (point[1] + (ch.offsetTimeDomain || 0)) / ch.voltsPerUnitTimeDomain;
                }

                const dist = Math.abs(svgY - pointSvgY);
                // Also factor in X distance? Ideally just pick this point if it's "close enough" to mouse Y?
                // Or just pick the channel that is strictly closest in Y at this X.
                if (dist < closestDist) {
                    closestDist = dist;
                    closestPoint = point;
                    closestChannelId = ch.id;
                }
            });

            if (closestPoint) {
                addLabel({
                    id: Date.now(),
                    x: closestPoint[0],
                    y: closestPoint[1],
                    channelId: closestChannelId,
                    isFreq: showFrequency
                });
            }
            return;
        }

        if (!cursor.active) return;

        // Simple hit testing or just allow grabbing anywhere for better UX?
        // User asked for "cursor cross dragable".
        // Let's allow dragging if we are "close enough" to the cursor X line.

        const rect = svg.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const svgX = (x / rect.width) * widthUnits; // Convert to calculated svg units

        // Calculate current cursor X to see if we are close
        const signal = signalList.find(s => s.id === cursor.channelId);
        if (!signal) return;

        let cursorX = -1;
        const index = cursor.index;

        if (showFrequency) {
            const data = signal.frequencyData;
            if (data && index < data.length) {
                const point = data[index];
                const currentFreqScale = controlPanelData.freqPerUnit || 1;
                const currentFreqOffset = controlPanelData.freqOffset || 0;
                cursorX = (point[0] + currentFreqOffset) / currentFreqScale;
            }
        } else {
            const data = signal.timeData;
            if (data && index < data.length) {
                const point = data[index];
                const timePerUnit = controlPanelData.timePerUnit || 1;
                const timeOffset = controlPanelData.timeOffset || 0;
                cursorX = (point[0] + timeOffset) / timePerUnit;
            }
        }

        // Threshold of 0.5 units (approx 5% of screen width)
        if (Math.abs(svgX - cursorX) < 1.0) {
            isDragging.current = true;
            e.target.setPointerCapture(e.pointerId);
            updateCursorFromPointer(e); // Snap to click immediately? Usually yes for "jump to click" or "drag"
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

    const updateCursorFromPointer = (e) => {
        const svg = svgRef.current;
        if (!svg) return;

        const rect = svg.getBoundingClientRect();
        // Clamp x to within rect
        const xPixels = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const svgX = (xPixels / rect.width) * widthUnits;

        const signal = signalList.find(s => s.id === cursor.channelId);
        if (!signal) return;

        let newIndex = 0;

        if (showFrequency) {
            const data = signal.frequencyData;
            if (data && data.length > 0) {
                // Invert: svgX = (freq + offset) / scale
                // freq = svgX * scale - offset
                const currentFreqScale = controlPanelData.freqPerUnit || 1;
                const currentFreqOffset = controlPanelData.freqOffset || 0;
                const targetFreq = svgX * currentFreqScale - currentFreqOffset;

                // Find closest index
                // Assuming sorted frequency data? FFT usually is.
                // Simple linear search or just fractional approx if we knew the step.
                // Let's do a simple closest search.
                let closestDist = Infinity;
                let closestIdx = 0;

                // Optimization: if uniform, calculate.
                // But let's be safe.
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
                // Invert: svgX = (time + offset) / scale
                // time = svgX * scale - offset
                const timePerUnit = controlPanelData.timePerUnit || 1;
                const timeOffset = controlPanelData.timeOffset || 0;
                const targetTime = svgX * timePerUnit - timeOffset;

                // Find closest index
                // Time data is usually sorted.
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

    return (
        <div className="scope-display" style={{ flex: 1, position: 'relative' }}>
            <div className="grid-background" />


            <svg
                ref={svgRef}
                viewBox={`0 0 ${widthUnits} ${heightUnits}`}
                className="signal-layer"
                preserveAspectRatio="none"
                style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
            >
                {signalList.map((sig) => (
                    <DisplaySignal
                        key={sig.id}
                        displaySignalData={sig}
                        controlPanelData={controlPanelData}
                    />
                ))}
                <DisplayCursor />
            </svg>
            {labels.map(label => (
                <DisplayLabel key={label.id} label={label} />
            ))}

            {/* Transparent overlay for interaction to ensure we catch events on top of everything */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    cursor: cursor.active ? 'ew-resize' : 'default',
                    touchAction: 'none' // Important for pointer events
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            />

            {/* Overlay */}
            <div style={{ color: 'white' }}>
                {showFrequency
                    ? `Freq/Div: ${controlPanelData.freqPerUnit} Hz`
                    : `Time/Div: ${controlPanelData.timePerUnit}s`
                }
            </div>
            <div style={{ color: 'white' }}>
                {showFrequency
                    ? `Nyquist: ${(controlPanelData.TotalSignalSamples / (controlPanelData.timePerUnit * 10) / 2).toFixed(1)} Hz`
                    : `Total Samples: ${controlPanelData.TotalSignalSamples}`
                }
            </div>
            {controlPanelData.channels.map(ch => ch.visible && (
                <div key={ch.id} style={{ color: ch.color }}>
                    {showFrequency
                        ? `CH${ch.id + 1}: ${(ch.voltsPerUnitFreqDomain || 1).toPrecision(3)} Mag/Div`
                        : `CH${ch.id + 1}: ${ch.voltsPerUnitTimeDomain} V/Div`
                    }
                </div>
            ))}
        </div>
    );
};

export default DisplayGraph;
