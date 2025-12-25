import React from 'react';

const ControlPanelTime = ({ controlPanelData, onUpdate }) => {
    const updateGlobal = (key, val) => {
        onUpdate({ ...controlPanelData, [key]: val });
    };

    return (
        <div className="panel-section" style={{ borderLeft: `3px solid white` }}>
            <div className="ch-header">
                <h3 className="panel-header" style={{ color: 'white' }}>Time</h3>
            </div>
            <div className="channel-controls">
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
                    <label>Total Samples</label>
                    <input
                        type="number"
                        step="10"
                        value={controlPanelData.TotalSignalSamples}
                        onChange={(e) => updateGlobal('TotalSignalSamples', parseFloat(e.target.value))}
                    />
                </div>
            </div>
        </div>
    );
};

export default ControlPanelTime;
