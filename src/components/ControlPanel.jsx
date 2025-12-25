import React from 'react';
import classNames from 'classnames';
import { performAutoSet } from './subcomponents/AutoSet';
import ControlPanelTime from './subcomponents/ControlPanelTime';
import ControlPanelChannel from './subcomponents/ControlPanelChannel';

const ControlPanel = ({ controlPanelData, signalData, onUpdate }) => {
    const handleAutoSet = () => {
        const newData = performAutoSet(controlPanelData, signalData);
        onUpdate(newData);
    };

    const updateChannel = (id, updates) => {
        const newChannels = controlPanelData.channels.map(ch =>
            ch.id === id ? { ...ch, ...updates } : ch
        );
        onUpdate({ ...controlPanelData, channels: newChannels });
    };

    return (
        <div className="control-panel">
            {/* Global Buttons Section */}
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
            />

            {controlPanelData.channels.map(ch => (
                <ControlPanelChannel
                    key={ch.id}
                    channel={ch}
                    onUpdate={updateChannel}
                />
            ))}
        </div>
    );
};

export default ControlPanel;
