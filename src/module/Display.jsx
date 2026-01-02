import React, { useEffect, useRef } from 'react';

import DisplayOffsetTab from './submodule1/DisplayOffsetTab';
import DisplaySignal from './submodule1/DisplaySignal';
import DisplayCursor from './submodule1/DisplayCursor';

import { useControlPanelStore } from '../stores/useControlPanelStore';
import { useSignalStore } from '../stores/useSignalStore';

import { defaultSignal } from '../utils/SignalGenerator';

const Display = () => {
    const { controlPanelData, updateControlPanelData } = useControlPanelStore();
    const { signalList, updateTimeData, cursor, setCursorIndex } = useSignalStore();

    // Simulation Time Ref
    const timeRef = useRef(0);
    const svgRef = useRef(null);
    const isDragging = useRef(false);

    const widthUnits = 10;
    const heightUnits = 8;
    const showFrequency = !controlPanelData.timeDomain;

    const handleChannelUpdate = (channelId, updates) => {
        const newChannels = controlPanelData.channels.map(ch =>
            ch.id === channelId ? { ...ch, ...updates } : ch
        );
        updateControlPanelData({ ...controlPanelData, channels: newChannels });
    };

    const handlePointerDown = (e) => {
        if (!cursor.active) return;

        // Simple hit testing or just allow grabbing anywhere for better UX?
        // User asked for "cursor cross dragable".
        // Let's allow dragging if we are "close enough" to the cursor X line.

        const svg = svgRef.current;
        if (!svg) return;

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
        <div style={{ display: 'flex', flex: 1, minWidth: 0, height: '100%', position: 'relative' }}>
            {/* Sidebar for Offset Tabs */}
            <div
                style={{
                    width: '50px',
                    height: 'calc(100% - 28px)',
                    marginTop: '14px',
                    position: 'relative',
                    backgroundColor: '#111',
                    borderRight: '1px solid #333',
                    overflow: 'hidden'
                }}
            >
                {controlPanelData.channels.map(ch => (
                    <DisplayOffsetTab
                        key={ch.id}
                        channel={ch}
                        onUpdate={(updates) => handleChannelUpdate(ch.id, updates)}
                        isFreqDomain={showFrequency}
                    />
                ))}
            </div>

            {/* Main Display Area */}
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
                            setDisplaySignalData={(newData) => updateTimeData(sig.id, newData.timeData)}
                            controlPanelData={controlPanelData}
                        />
                    ))}
                    <DisplayCursor />
                </svg>

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
        </div>
    );
};

export default Display;
