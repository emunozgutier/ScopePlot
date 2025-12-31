import React from 'react';
import classNames from 'classnames';
import { performAutoSet } from './submodule1/AutoSet';
import ControlPanelTime from './submodule1/ControlPanelTime';
import ControlPanelChannel from './submodule1/ControlPanelChannel';
import { useControlPanelStore } from '../stores/useControlPanelStore';
import { useSignalStore } from '../stores/useSignalStore';
import { computeFFT } from '../utils/fft';

const ControlPanel = () => {
    const { controlPanelData, updateControlPanelData, setTimeDomain } = useControlPanelStore();
    const { signalData, calculateFrequencyData } = useSignalStore();

    const handleGlobalUpdate = (newData) => {
        updateControlPanelData(newData);
    };

    const handleAutoSet = () => {
        const newData = performAutoSet(controlPanelData, signalData);
        handleGlobalUpdate(newData);
    };

    const handleChannelUpdate = (chId, newData) => {
        const newChannels = controlPanelData.channels.map(ch =>
            ch.id === chId ? { ...ch, ...newData } : ch
        );
        updateControlPanelData({ ...controlPanelData, channels: newChannels });
    };

    const onFreqDomain = () => {
        const newTimeDomain = !controlPanelData.timeDomain;

        if (!newTimeDomain) {
            // Switching TO Frequency Domain -> Compute FFT
            signalData.forEach(sig => {
                if (sig.timeData && sig.timeData.length > 0) {
                    calculateFrequencyData(sig.id);
                }
            });
        }

        setTimeDomain(newTimeDomain);
    };

    // Calculate Max Samples based on signal data
    const channelStats = controlPanelData.channels
        .filter(ch => ch.visible)
        .map(ch => {
            const sig = signalData.find(s => s.id === ch.id);
            const max = sig && sig.timeData ? sig.timeData.length : 0;
            return {
                id: ch.id,
                color: ch.color,
                maxSamples: max
            };
        });

    const maxSamples = channelStats.length > 0
        ? Math.max(...channelStats.map(s => s.maxSamples))
        : 5000;

    return (
        <div className="control-panel" style={{ width: '300px', backgroundColor: '#222', padding: '10px', overflowY: 'auto' }}>
            <h2 style={{ color: 'white', marginTop: 0 }}>Controls</h2>

            {/* Global Controls */}
            <div className="panel-section">
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 className="panel-header" style={{ marginBottom: 0 }}>Global</h3>
                    <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={handleAutoSet}>
                        Auto Set
                    </button>
                    <button
                        className={classNames("btn-secondary", { "blink": !controlPanelData.timeDomain })}
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                        onClick={onFreqDomain}
                    >
                        Freq Domain
                    </button>
                </div>
            </div>

            <ControlPanelTime
                controlPanelData={controlPanelData}
                onUpdate={handleGlobalUpdate}
                maxSamples={maxSamples}
                channelStats={channelStats}
            />

            {controlPanelData.channels.map(ch => (
                <ControlPanelChannel
                    key={ch.id}
                    channel={ch}
                    onUpdate={handleChannelUpdate}
                />
            ))}
        </div>
    );
};

export default ControlPanel;
