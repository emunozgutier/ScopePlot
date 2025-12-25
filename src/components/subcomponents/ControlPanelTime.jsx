import React from 'react';
import Knob from './subcomponents/Knob';
import { formatMetric } from './subcomponents/KnobNumber';

const ControlPanelTime = ({ controlPanelData, onUpdate }) => {
    const updateGlobal = (key, val) => {
        onUpdate({ ...controlPanelData, [key]: val });
    };

    return (
        <div className="panel-section" style={{ borderLeft: `3px solid white` }}>
            <div className="ch-header">
                <h3 className="panel-header" style={{ color: 'white' }}>Time</h3>
            </div>
            <div className="channel-controls" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', width: '100%', padding: '5px' }}>

                {/* Spacer to match Channel Buttons column */}
                <div className="control-column" style={{ width: '50px', display: 'flex', flexDirection: 'column' }}></div>

                <div className="knobs-row" style={{ display: 'flex', gap: '80px', flex: 1, justifyContent: 'center' }}>
                    <Knob
                        label="Time/Div"
                        value={controlPanelData.timePerUnit}
                        onChange={(val) => updateGlobal('timePerUnit', val)}
                        stepType="1-2-5"
                        color="white"
                        format={(v) => formatMetric(v, 's')}
                    />
                    <Knob
                        label="Total Samples"
                        value={controlPanelData.TotalSignalSamples}
                        onChange={(val) => updateGlobal('TotalSignalSamples', val)}
                        min={10}
                        max={100e6}
                        stepType="1-2-5"
                        color="white"
                        format={(v) => formatMetric(v, 'Sa')}
                    />
                </div>
            </div>
        </div>
    );
};

export default ControlPanelTime;
