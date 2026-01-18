import React from 'react';
import { useControlPanelStore } from '../../stores/useControlPanelStore';

const DisplayAxis = () => {
    const { controlPanelData } = useControlPanelStore();
    const showFrequency = !controlPanelData.timeDomain;
    const widthUnits = 10;

    const formatLabel = (val) => {
        if (val === 0) return "0";
        if (Math.abs(val) < 0.01) return val.toExponential(1);
        if (Math.abs(val) >= 1000) return val.toExponential(1);
        return val.toFixed(2);
    };

    const renderXAxisLabels = () => {
        const labels = [];
        const scale = showFrequency ? (controlPanelData.freqPerUnit || 1) : (controlPanelData.timePerUnit || 1);
        const offset = showFrequency ? (controlPanelData.freqOffset || 0) : (controlPanelData.timeOffset || 0);

        for (let i = 0; i <= widthUnits; i++) {
            // Calculate value at this grid line
            // svgX = i (0 to 10)
            // val = svgX * scale - offset
            const val = i * scale - offset;
            labels.push(
                <div key={i} style={{
                    position: 'absolute',
                    left: `${(i / widthUnits) * 100}%`,
                    transform: 'translateX(-50%)',
                    bottom: '2px',
                    fontSize: '10px',
                    color: '#aaa',
                    whiteSpace: 'nowrap'
                }}>
                    {formatLabel(val)} {showFrequency && i === widthUnits ? 'Hz' : (i === widthUnits ? 's' : '')}
                </div>
            );
        }
        return labels;
    };

    return (
        <div style={{
            height: '25px',
            position: 'relative',
            marginLeft: '50px', // Match sidebar width
            borderTop: '1px solid #333'
        }}>
            {renderXAxisLabels()}
        </div>
    );
};

export default DisplayAxis;
