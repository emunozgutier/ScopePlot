import React from 'react';
import classNames from 'classnames';
import { performAutoSet } from './subcomponents/AutoSet';
import ControlPanelTime from './subcomponents/ControlPanelTime';
import ControlPanelChannel from './subcomponents/ControlPanelChannel';
import { useControlPanelStore } from '../stores/useControlPanelStore';
import { useSignalStore } from '../stores/useSignalStore';

const ControlPanel = () => {
    const { controlPanelData, updateControlPanelData, setTimeDomain } = useControlPanelStore();
    const { displayData } = useSignalStore();
    const signalData = displayData.signalData;

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
        // Toggle domain
        setTimeDomain(!controlPanelData.timeDomain);
    };

    // Calculate Max Samples - actually we want to allow the user to SET the target samples
    // The previous logic clamped the knob to the current signal length, preventing increase.
    // We should allow the knob to go up to the system max (e.g. 5000).
    // The signal generation will then catch up.
    let maxSamples = 5000;


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
                    <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={onFreqDomain}>
                        Freq Domain
                    </button>
                </div>
            </div>

            <ControlPanelTime
                controlPanelData={controlPanelData}
                onUpdate={handleGlobalUpdate}
                maxSamples={maxSamples}
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
