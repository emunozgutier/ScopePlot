import React from 'react';
import DisplayPoint from './submodule3/DisplayPoint';

/**
 * DisplaySignalTime Component
 * Renders the time domain signal trace and points.
 */
const DisplaySignalTime = ({ displaySignalData, controlPanelData, color }) => {
    const {
        voltsPerUnitTimeDomain, offsetTimeDomain
    } = controlPanelData.channels.find(ch => ch.id === displaySignalData.id) || {};

    const {
        timePerUnit, timeOffset
    } = controlPanelData;

    const voltageTimeData = displaySignalData.timeData || [];
    if (!voltageTimeData || voltageTimeData.length < 2) return null;

    const currentVolts = voltsPerUnitTimeDomain || 1;
    const currentOffset = offsetTimeDomain || 0;

    // Trace uses full resolution
    const points = voltageTimeData.map(([t, v]) => {
        const x = ((t + (timeOffset || 0)) / timePerUnit);
        const y = 4 - (v + currentOffset) / currentVolts;
        return { x, y };
    });

    // Sampled points for rendering Dots
    let displayPoints = [];
    const sampledRaw = displaySignalData.timeDataSample;
    if (sampledRaw && sampledRaw.length > 0) {
        displayPoints = sampledRaw.map(([t, v]) => {
            const x = ((t + (timeOffset || 0)) / timePerUnit);
            const y = 4 - (v + currentOffset) / currentVolts;
            return { x, y };
        });
    } else {
        // Fallback to full data if sampling missing
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

export default DisplaySignalTime;
