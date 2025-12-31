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

    // Simulation Loop (moved from App.jsx)
    useEffect(() => {
        let animationFrameId;

        const renderLoop = () => {
            const controlPanelData = useControlPanelStore.getState().controlPanelData;
            const { timePerUnit, TotalSignalSamples } = controlPanelData;

            timeRef.current += 0.02;

            const prevSignals = useSignalStore.getState().signalList;

            let hasChanges = false;
            const newSignals = prevSignals.map(sig => {
                const tData = sig.timeData;

                // --- Default Zero Data Logic ---
                if (sig.defaultZeroData === true) {
                    const count = Math.min(5000, TotalSignalSamples);
                    // Resize if needed
                    if (!tData || tData.length !== count) {
                        const newTimeData = defaultSignal(timePerUnit, TotalSignalSamples);
                        const newSample = getSampledData(newTimeData, 'time', controlPanelData);
                        return { ...sig, timeData: newTimeData, timeDataSample: newSample };
                    }
                    return sig;
                }

                // --- Static Data Logic ---
                if (sig.defaultZeroData === false && tData && tData.length > 0) {
                    // If length mismatch, assume we might need to regenerate? 
                    // App.jsx logic: if length === count, return sig.
                    if (tData.length === Math.min(5000, TotalSignalSamples)) {
                        return sig;
                    }
                    // If mismatch, fall through to simulation? Or regenerate?
                    // App.jsx fell through to simulation for *all* signals if static check failed?
                    // Actually, App.jsx logic implies if it's NOT defaultZeroData AND has data, it skips simulation unless length mismatch...
                    // Wait, if length mismatch, it basically re-simulates.
                    // But if it's static user data (e.g. loaded file), we shouldn't simulate.
                    // App.jsx logic was a bit specific to "simulated signals".
                    // For now, I'll copy App.jsx logic strictly.
                }

                // --- Simulation Logic ---
                hasChanges = true;
                const points = [];
                const chSettings = controlPanelData.channels.find(c => c.id === sig.id);

                if (!chSettings || !chSettings.visible) {
                    return { ...sig, timeData: [] };
                }

                const count = Math.min(5000, TotalSignalSamples);

                for (let i = 0; i < count; i++) {
                    const relativeT = (i / count) * (10 * timePerUnit);
                    let val = 0;
                    const phase = timeRef.current * 5;
                    const freq = 1 + sig.id;

                    if (sig.id === 0) {
                        val = Math.sin(relativeT * freq + phase);
                    } else if (sig.id === 1) {
                        val = Math.sin(relativeT * freq + phase) > 0 ? 1 : -1;
                    } else if (sig.id === 2) {
                        val = Math.asin(Math.sin(relativeT * freq + phase));
                    } else {
                        val = (Math.random() - 0.5);
                    }
                    if (chSettings.noiseFilter) val *= 0.5;
                    points.push([relativeT, val * 3]);
                }

                const newT = points;
                const newTSample = getSampledData(newT, 'time', controlPanelData);
                return { ...sig, timeData: newT, timeDataSample: newTSample };
            });

            if (hasChanges) {
                useSignalStore.setState({ signalList: newSignals });
            }

            animationFrameId = requestAnimationFrame(renderLoop);
        };

        renderLoop();
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    // Control Panel Update Effect (moved from App.jsx)
    useEffect(() => {
        const currentSignals = useSignalStore.getState().signalList;
        const newSignals = currentSignals.map(sig => {
            if (sig.timeData && sig.timeData.length > 0) {
                const newSample = getSampledData(sig.timeData, 'time', controlPanelData);
                return { ...sig, timeDataSample: newSample };
            }
            return sig;
        });
        useSignalStore.setState({ signalList: newSignals });
    }, [controlPanelData.timePerUnit, controlPanelData.TotalSignalSamples, controlPanelData.timeOffset]);

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
