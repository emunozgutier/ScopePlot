import React from 'react';
import classNames from 'classnames';
import { performAutoSet } from './subcomponents/AutoSet';
import ControlPanelTime from './subcomponents/ControlPanelTime';
import ControlPanelChannel from './subcomponents/ControlPanelChannel';

const ControlPanel = ({ controlPanelData, signalData, onUpdate }) => {
    const handleGlobalUpdate = (newData) => {
        onUpdate(newData);
    };

    const handleAutoSet = () => {
        const newData = performAutoSet(controlPanelData, signalData);
        handleGlobalUpdate(newData);
    };

    const handleChannelUpdate = (chId, newData) => {
        const newChannels = controlPanelData.channels.map(ch =>
            ch.id === chId ? { ...ch, ...newData } : ch
        );
        onUpdate({ ...controlPanelData, channels: newChannels });
    };

    // Calculate Max Samples from Active Channels
    let maxSamples = 0;
    const activeChannels = signalData.filter(s => {
        const ch = controlPanelData.channels.find(c => c.id === s.id);
        return ch && ch.visible;
    });

    if (activeChannels.length > 0) {
        const lengths = activeChannels.map(s => s.voltageTimeData ? s.voltageTimeData.length : 0);
        maxSamples = Math.max(...lengths);
    } else {
        maxSamples = 5000; // Default limit if no channels active
    }

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
                    <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }}>
                        Freq Domain
                    </button>
                </div>
            </div>

            <ControlPanelTime
                controlPanelData={controlPanelData}
                onUpdate={onUpdate}
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
