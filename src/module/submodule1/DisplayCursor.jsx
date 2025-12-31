import React from 'react';
import { useSignalStore } from '../../stores/useSignalStore';
import { useControlPanelStore } from '../../stores/useControlPanelStore';

const DisplayCursor = () => {
    const { cursor, signalList } = useSignalStore();
    const { controlPanelData } = useControlPanelStore();

    if (!cursor.active) return null;

    const { channelId, index } = cursor;
    const signal = signalList.find(s => s.id === channelId);

    if (!signal) return null;

    const { channels, timePerUnit, timeOffset, TotalSignalSamples, timeDomain } = controlPanelData;
    const channelConfig = channels.find(ch => ch.id === channelId);

    // If channel is hidden, do we show cursor? Probably yes, or maybe not. 
    // Usually cursors are for measuring, so even if hidden, maybe? 
    // But data might not be visually there. Let's assume we show it if data exists.
    if (!channelConfig) return null;

    const { voltsPerUnit, offset, color } = channelConfig;
    const isFreqDomain = !timeDomain;

    let x = 0;
    let y = 0;
    let isValid = false;

    if (isFreqDomain) {
        // Frequency Domain Logic
        const data = signal.frequencyData;
        if (data && index < data.length) {
            const point = data[index]; // [freq, mag]
            const totalTime = timePerUnit * 10;
            const maxFreq = (TotalSignalSamples / totalTime) / 2;

            x = (point[0] / maxFreq) * 10;
            y = 8 - (point[1] * 10);
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
            {/* Vertical Line of the Cross */}
            <line
                x1={x}
                y1={y - crossSize}
                x2={x}
                y2={y + crossSize}
                stroke={color} // Use channel color for cursor
                strokeWidth="0.05"
            />
            {/* Horizontal Line of the Cross */}
            <line
                x1={x - crossSize}
                y1={y}
                x2={x + crossSize}
                y2={y}
                stroke={color}
                strokeWidth="0.05"
            />
            {/* Optional: Full screen crosshair lines with lower opacity? 
                User said "shows ontop of the selected dot", implying local cross.
                I'll stick to local cross.
            */}
        </g>
    );
};

export default DisplayCursor;
