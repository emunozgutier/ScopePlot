import React from 'react';
import DisplayPoint from './submodule2/DisplayPoint';

/**
 * DisplaySignal Component
 * Renders an oscilloscope signal trace and its data points.
 */
const DisplaySignal = ({ displaySignalData, controlPanelData }) => {
    const { id } = displaySignalData;
    const channelConfig = controlPanelData.channels.find(ch => ch.id === id) || {};
    const {
        voltsPerUnitTimeDomain, offsetTimeDomain,
        voltsPerUnitFreqDomain, offsetFreqDomain,
        color, visible
    } = channelConfig;

    const {
        timePerUnit, timeOffset,
        freqPerUnit, freqOffset,
        TotalSignalSamples, timeDomain
    } = controlPanelData;

    const showFrequency = !timeDomain;

    if (!visible) return null;

    let points = []; // Trace points (High Res)
    let displayPoints = []; // Dot points (Sampled)

    // Check Domain from Control Panel Data (or showFrequency prop if passed from App)
    if (showFrequency && !timeDomain) {
        // --- Frequency Domain ---
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

        points = data.map(mapFreqPoint);

        // Sampling for Freq Domain (if available)
        if (displaySignalData.frequencyDataSample && displaySignalData.frequencyDataSample.length > 0) {
            displayPoints = displaySignalData.frequencyDataSample.map(mapFreqPoint);
        } else {
            displayPoints = points;
        }

    } else {
        // --- Time Domain ---
        const voltageTimeData = displaySignalData.timeData || [];
        if (!voltageTimeData || voltageTimeData.length < 2) return null;

        const currentVolts = voltsPerUnitTimeDomain || 1;
        const currentOffset = offsetTimeDomain || 0;

        // Trace uses full resolution
        points = voltageTimeData.map(([t, v]) => {
            const x = ((t + (timeOffset || 0)) / timePerUnit);
            const y = 4 - (v + currentOffset) / currentVolts;
            return { x, y };
        });

        // Sampled points for rendering Dots
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

// --- Helper / Generator Functions ---

/**
 * Generates a default zero-voltage signal.
 */




export default DisplaySignal;
