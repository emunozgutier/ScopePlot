import React from 'react';
import DisplayPoint from './submodule2/DisplayPoint';

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

    let points = []; // Trace points (High Res)
    let displayPoints = []; // Dot points (Sampled)

    // Check Domain from Control Panel Data (or showFrequency prop if passed from App)
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

        const mapFreqPoint = (d) => {
            const x = (d.freq / maxFreq) * 10;
            const y = 8 - (d.magnitude * 10);
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

        // Trace uses full resolution
        points = voltageTimeData.map(([t, v]) => {
            const x = ((t + (timeOffset || 0)) / timePerUnit);
            const y = 4 - (v + offset) / voltsPerUnit;
            return { x, y };
        });

        // Sampled points for rendering Dots
        const sampledRaw = displaySignalData.timeDataSample;
        if (sampledRaw && sampledRaw.length > 0) {
            displayPoints = sampledRaw.map(([t, v]) => {
                const x = ((t + (timeOffset || 0)) / timePerUnit);
                const y = 4 - (v + offset) / voltsPerUnit;
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
