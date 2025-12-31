import React, { useEffect, useRef } from 'react';

import DisplayOffsetTab from './submodule1/DisplayOffsetTab';
import DisplaySignal from './submodule1/DisplaySignal';

import { useControlPanelStore } from '../stores/useControlPanelStore';
import { useSignalStore } from '../stores/useSignalStore';

import { defaultSignal } from '../utils/SignalGenerator';

const Display = () => {
    const { controlPanelData, updateControlPanelData } = useControlPanelStore();
    const { signalList, updateTimeData } = useSignalStore();

    // Simulation Time Ref
    const timeRef = useRef(0);

    const widthUnits = 10;
    const heightUnits = 8;
    const showFrequency = !controlPanelData.timeDomain;

    const handleChannelUpdate = (channelId, updates) => {
        const newChannels = controlPanelData.channels.map(ch =>
            ch.id === channelId ? { ...ch, ...updates } : ch
        );
        updateControlPanelData({ ...controlPanelData, channels: newChannels });
    };


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
                style={{
                    width: '50px',
                    height: 'calc(100% - 28px)',
                    marginTop: '14px',
                    position: 'relative',
                    backgroundColor: '#111',
                    borderRight: '1px solid #333',
                    overflow: 'hidden'
                }}
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


                <svg
                    viewBox={`0 0 ${widthUnits} ${heightUnits}`}
                    className="signal-layer"
                    preserveAspectRatio="none"
                    style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
                >
                    {signalList.map((sig) => (
                        <DisplaySignal
                            key={sig.id}
                            displaySignalData={sig}
                            setDisplaySignalData={(newData) => updateTimeData(sig.id, newData.timeData)}
                            controlPanelData={controlPanelData}
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
