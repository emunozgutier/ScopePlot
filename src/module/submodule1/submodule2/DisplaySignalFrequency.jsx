import React from 'react';
import DisplayPoint from './submodule3/DisplayPoint';

/**
 * DisplaySignalFrequency Component
 * Renders the frequency domain signal trace and points.
 */
const DisplaySignalFrequency = ({ displaySignalData, controlPanelData, color }) => {
    const {
        voltsPerUnitFreqDomain, offsetFreqDomain
    } = controlPanelData.channels.find(ch => ch.id === displaySignalData.id) || {};

    const {
        freqPerUnit, freqOffset
    } = controlPanelData;

    // Access frequencyData directly from signal
    const data = displaySignalData.frequencyData;
    if (!data) return null;

    const currentVolts = voltsPerUnitFreqDomain || 1;
    const currentOffset = offsetFreqDomain || 0;
    const currentFreqScale = freqPerUnit || 1; // Hz/div
    const currentFreqOffset = freqOffset || 0;

    const mapFreqPoint = (d) => {
        // d is [freq, magnitude]
        // X = (Freq + Offset) / Scale
        const x = (d[0] + currentFreqOffset) / currentFreqScale;

        // Y: Mag is plotted as: y = 8 - (mag * 10 + offset) / voltsPerUnit
        // Assuming d[1] * 10 equates to approx voltage level
        const y = 8 - ((d[1] * 10) + currentOffset) / currentVolts;
        return { x, y };
    };

    const points = data.map(mapFreqPoint);

    // Sampling for Freq Domain (if available)
    let displayPoints = [];
    if (displaySignalData.frequencyDataSample && displaySignalData.frequencyDataSample.length > 0) {
        displayPoints = displaySignalData.frequencyDataSample.map(mapFreqPoint);
    } else {
        displayPoints = points;
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
            {/* The Data Points - Uses Downsampled Data */}
            {displayPoints.map((p, index) => (
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

export default DisplaySignalFrequency;
