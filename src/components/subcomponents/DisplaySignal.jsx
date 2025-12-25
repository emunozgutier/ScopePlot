import React from 'react';
import DisplayPoint from './subcomponents/DisplayPoint';

/**
 * DisplaySignal Component
 * Renders an oscilloscope signal trace and its data points.
 */
const DisplaySignal = ({ signal, controlPanelData }) => {
    const { voltageTimeData, id } = signal;
    const { voltsPerUnit, offset, color, visible } = controlPanelData.channels.find(ch => ch.id === id) || {};
    const { timePerUnit } = controlPanelData;

    if (!visible || !voltageTimeData || voltageTimeData.length < 2) return null;

    // Map data to SVG coordinates
    const points = voltageTimeData.map(([t, v]) => {
        const x = (t / timePerUnit);
        const y = 4 - (v + offset) / voltsPerUnit;
        return { x, y };
    });

    // Create Path String
    const pathD = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;

    return (
        <g className="display-signal-group">
            {/* The Trace Line */}
            <path
                d={pathD}
                fill="none"
                stroke={color}
                strokeWidth="0.05"
                vectorEffect="non-scaling-stroke"
            />
            {/* The Data Points */}
            {points.map((p, index) => (
                <DisplayPoint
                    key={index}
                    x={p.x}
                    y={p.y}
                    color={color}
                    radius={0.025} // Halved radius
                />
            ))}
        </g>
    );
};

// --- Helper / Generator Functions ---

/**
 * Generates a default zero-voltage signal.
 */
export const defaultSignal = (timePerDiv, totalSamples) => {
    console.log("DisplaySignal.defaultSignal called with:", { timePerDiv, totalSamples });
    const points = [];
    const totalTime = timePerDiv * 10;

    if (totalSamples <= 0) return points;

    if (totalSamples === 1) {
        return [[0, 0]];
    }

    for (let i = 0; i < totalSamples; i++) {
        const t = (i / (totalSamples - 1)) * totalTime;
        const v = 0;
        points.push([t, v]);
    }
    console.log("DisplaySignal.defaultSignal generated points:", points.length);
    return points;
};

/**
 * Generates a signal buffer based on configuration.
 */
export const generateBuffer = (config) => {
    const { duration, sampleRate, frequency, shape, amplitude } = config;
    const count = Math.floor(duration * sampleRate);
    const points = [];

    for (let i = 0; i < count; i++) {
        const t = i / sampleRate;
        const phase = 0;
        const omega = 2 * Math.PI * frequency;
        let val = 0;

        if (shape === 'sine') {
            val = Math.sin(omega * t + phase);
        } else if (shape === 'square') {
            val = Math.sin(omega * t + phase) > 0 ? 1 : -1;
        } else if (shape === 'triangle') {
            val = (2 / Math.PI) * Math.asin(Math.sin(omega * t + phase));
        }

        points.push([t, val * amplitude]);
    }
    return points;
};

export default DisplaySignal;
