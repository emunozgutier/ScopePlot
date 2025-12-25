import React from 'react';

import DisplayOffsetTab from './subcomponents/DisplayOffsetTab';

const Display = ({ displayData, controlPanelData }) => {
    const widthUnits = 10;
    const heightUnits = 8;

    // Helper to map data point to SVG coordinates
    const mapDataToPath = (voltageTimeData, channelSettings) => {
        if (!voltageTimeData || voltageTimeData.length === 0) return '';

        const { voltsPerUnit, offset } = channelSettings;

        if (voltageTimeData.length < 2) return '';

        const points = voltageTimeData.map(([t, v]) => {
            // t is either calculated relative to window or absolute.
            // We divide by timePerUnit to get X unit position.
            const x = (t / controlPanelData.timePerUnit);
            const y = 4 - (v + offset) / voltsPerUnit;
            return `${x},${y}`;
        });

        return `M ${points.join(' L ')}`;
    };

    return (
        <div style={{ display: 'flex', flex: 1, minWidth: 0, height: '100%', position: 'relative' }}>
            {/* Sidebar for Offset Tabs */}
            <div style={{ width: '40px', height: '100%', position: 'relative', backgroundColor: '#111', borderRight: '1px solid #333', overflow: 'hidden' }}>
                {controlPanelData.channels.map(ch => (
                    <DisplayOffsetTab key={ch.id} channel={ch} />
                ))}
            </div>

            {/* Main Display Area */}
            <div className="scope-display" style={{ flex: 1, position: 'relative' }}>
                <div className="grid-background" />
                <div className="center-crosshair" />

                <svg
                    viewBox={`0 0 ${widthUnits} ${heightUnits}`}
                    className="signal-layer"
                    preserveAspectRatio="none"
                    style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
                >
                    {displayData.signalData.map((sig) => {
                        const chSettings = controlPanelData.channels.find(ch => ch.id === sig.id);
                        if (!chSettings || !chSettings.visible) return null;

                        return (
                            <path
                                key={sig.id}
                                d={mapDataToPath(sig.voltageTimeData, chSettings)}
                                fill="none"
                                stroke={chSettings.color}
                                strokeWidth="0.05"
                                vectorEffect="non-scaling-stroke"
                            />
                        );
                    })}
                </svg>

                <div className="signal-overlay">
                    <div style={{ color: 'white' }}>Time/Div: {controlPanelData.timePerUnit}s</div>
                    <div style={{ color: 'white' }}>Total Samples: {controlPanelData.TotalSignalSamples}</div>
                    {controlPanelData.channels.map(ch => ch.visible && (
                        <div key={ch.id} style={{ color: ch.color }}>
                            CH{ch.id + 1}: {ch.voltsPerUnit}V/Div
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Display;
