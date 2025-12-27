import React from 'react';
import DisplayPoint from './subcomponents/DisplayPoint';

/**
 * DisplaySignal Component
 * Renders an oscilloscope signal trace and its data points.
 */
const DisplaySignal = ({ displaySignalData, setDisplaySignalData, controlPanelData }) => {
    const { id } = displaySignalData;
    const { voltsPerUnit, offset, color, visible } = controlPanelData.channels.find(ch => ch.id === id) || {};
    const { timePerUnit, timeOffset, TotalSignalSamples, timeDomain } = controlPanelData;

    const showFrequency = !timeDomain;

    if (!visible) return null;

    let points = [];

    // Check Domain from Control Panel Data (or showFrequency prop if passed from App)
    // showFrequency comes from !timeDomain in App.jsx

    if (showFrequency && !timeDomain) {
        // --- Frequency Domain ---
        // Access frequencyData directly from signal
        const chFreqData = displaySignalData.frequencyData;
        if (!chFreqData || !chFreqData.data) return null;

        const data = chFreqData.data;
        // X-Axis: Frequency
        // Max Frequency = SampleRate / 2
        // SampleRate = TotalSamples / TotalTime
        // TotalTime = timePerUnit * 10
        const totalTime = timePerUnit * 10;
        const maxFreq = (TotalSignalSamples / totalTime) / 2;

        points = data.map((d) => {
            // x: 0 to 10
            // d.freq goes from 0 to maxFreq
            const x = (d.freq / maxFreq) * 10;

            // y: Magnitude.
            const y = 8 - (d.magnitude * 10); // Arbitrary scaling for visibility

            return { x, y };
        });

    } else {
        // --- Time Domain ---
        // --- Time Domain ---
        const voltageTimeData = displaySignalData.timeData || [];
        if (!voltageTimeData || voltageTimeData.length < 2) return null;

        points = voltageTimeData.map(([t, v]) => {
            const x = ((t + (timeOffset || 0)) / timePerUnit);
            const y = 4 - (v + offset) / voltsPerUnit;
            return { x, y };
        });
    }

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
            {/* The Data Points - Optional: Hide for large FFT? */}
            {points.map((p, index) => (
                <DisplayPoint
                    key={index}
                    x={p.x}
                    y={p.y}
                    color={color}
                    radius={0.025}
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
