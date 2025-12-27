import React from 'react';

import DisplayOffsetTab from './subcomponents/DisplayOffsetTab';
import DisplaySignal from './subcomponents/DisplaySignal';

const Display = ({ displayData, controlPanelData, onUpdate, showFrequency, frequencyData }) => {
    const widthUnits = 10;
    const heightUnits = 8;

    // ... (keep handleChannelUpdate)

    // Removed manual mapDataToPath as it is now inside DisplaySignal

    const sidebarRef = React.useRef(null);
    const [sidebarHeight, setSidebarHeight] = React.useState(0);

    React.useEffect(() => {
        if (!sidebarRef.current) return;

        const updateHeight = () => {
            if (sidebarRef.current) {
                setSidebarHeight(sidebarRef.current.clientHeight);
            }
        };

        updateHeight();
        window.addEventListener('resize', updateHeight);
        return () => window.removeEventListener('resize', updateHeight);
    }, []);

    return (
        <div style={{ display: 'flex', flex: 1, minWidth: 0, height: '100%', position: 'relative' }}>
            {/* Sidebar for Offset Tabs */}
            <div
                ref={sidebarRef}
                style={{ width: '50px', height: '100%', position: 'relative', backgroundColor: '#111', borderRight: '1px solid #333', overflow: 'hidden' }}
            >
                {controlPanelData.channels.map(ch => (
                    <DisplayOffsetTab
                        key={ch.id}
                        channel={ch}
                        onUpdate={(updates) => handleChannelUpdate(ch.id, updates)}
                        parentHeight={sidebarHeight}
                    />
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
                    {displayData.signalData.map((sig) => (
                        <DisplaySignal
                            key={sig.id}
                            signal={sig}
                            controlPanelData={controlPanelData}
                            showFrequency={showFrequency}
                            frequencyData={frequencyData}
                        />
                    ))}
                </svg>

                {/* Overlay */}
                <div style={{ color: 'white' }}>
                    {showFrequency
                        ? `Freq/Div: ${(controlPanelData.TotalSignalSamples / (controlPanelData.timePerUnit * 10 * 10)).toFixed(1)} Hz`
                        : `Time/Div: ${controlPanelData.timePerUnit}s`
                    }
                </div>
                <div style={{ color: 'white' }}>
                    {showFrequency
                        ? `Max Freq: ${(controlPanelData.TotalSignalSamples / (controlPanelData.timePerUnit * 10) / 2).toFixed(1)} Hz`
                        : `Total Samples: ${controlPanelData.TotalSignalSamples}`
                    }
                </div>
                {controlPanelData.channels.map(ch => ch.visible && (
                    <div key={ch.id} style={{ color: ch.color }}>
                        {showFrequency
                            ? `CH${ch.id + 1}: Mag/Div`
                            : `CH${ch.id + 1}: ${ch.voltsPerUnit}V/Div`
                        }
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Display;
