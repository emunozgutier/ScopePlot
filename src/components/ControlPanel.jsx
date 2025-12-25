import React from 'react';
import classNames from 'classnames';
import { performAutoSet } from './subcomponents/AutoSet';

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

    const updateGlobal = (key, val) => {
        onUpdate({ ...controlPanelData, [key]: val });
    };

    return (
        <div className="control-panel">
            <div className="panel-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 className="panel-header" style={{ marginBottom: 0 }}>Global</h3>
                    <button className="btn-secondary" style={{ padding: '2px 8px', fontSize: '11px' }} onClick={handleAutoSet}>
                        Auto Set
                    </button>
                </div>
                <div className="control-row">
                    <label>Time/Div (s)</label>
                    <input
                        type="number"
                        step="0.1"
                        value={controlPanelData.timePerUnit}
                        onChange={(e) => updateGlobal('timePerUnit', parseFloat(e.target.value))}
                    />
                </div>
                <div className="control-row">
                    <label>Samples/s</label>
                    <input
                        type="number"
                        step="10"
                        value={controlPanelData.samplesPerSecond}
                        onChange={(e) => updateGlobal('samplesPerSecond', parseFloat(e.target.value))}
                    />
                </div>
            </div>

            {controlPanelData.channels.map(ch => (
                <div key={ch.id} className="panel-section" style={{ borderLeft: `3px solid ${ch.color} ` }}>
                    <div className="ch-header">
                        <h3 className="panel-header" style={{ color: ch.color }}>Channel {ch.id + 1}</h3>
                        <button
                            className={classNames('toggle-btn', { active: ch.visible })}
                            onClick={() => updateChannel(ch.id, { visible: !ch.visible })}
                        >
                            {ch.visible ? 'ON' : 'OFF'}
                        </button>
                    </div>

                    {ch.visible && (
                        <div className="channel-controls">
                            <div className="control-row">
                                <label>Volts/Div</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={ch.voltsPerUnit}
                                    onChange={(e) => updateChannel(ch.id, { voltsPerUnit: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div className="control-row">
                                <label>Offset (V)</label>
                                <input
                                    type="range"
                                    min="-10" max="10" step="0.5"
                                    value={ch.offset}
                                    onChange={(e) => updateChannel(ch.id, { offset: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div className="control-row">
                                <button
                                    className={classNames('toggle-btn', { active: ch.acMode })}
                                    onClick={() => updateChannel(ch.id, { acMode: !ch.acMode })}
                                >
                                    {ch.acMode ? 'AC' : 'DC'}
                                </button>
                                <button
                                    className={classNames('toggle-btn', { active: ch.noiseFilter })}
                                    onClick={() => updateChannel(ch.id, { noiseFilter: !ch.noiseFilter })}
                                >
                                    Filter
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ControlPanel;
