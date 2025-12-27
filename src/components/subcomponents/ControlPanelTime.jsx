import React from 'react';
import Knob from './subcomponents/Knob';

const ControlPanelTime = ({ controlPanelData, onUpdate, maxSamples }) => {
    const { timePerUnit, TotalSignalSamples, timeOffset } = controlPanelData;

    const updateGlobal = (key, value) => {
        onUpdate({
            ...controlPanelData,
            [key]: value
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h3 style={{ margin: 0, color: 'white', borderBottom: '1px solid #555', paddingBottom: '5px' }}>Frequency</h3>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                <Knob
                    label="Freq/Div"
                    value={timePerUnit}
                    onChange={(val) => updateGlobal('timePerUnit', val)}
                    stepType="1-2-5"
                    min={0.001}
                    max={100}
                    unit="Hz"
                />
                <Knob
                    label="Offset"
                    value={timeOffset || 0}
                    onChange={(val) => updateGlobal('timeOffset', val)}
                    step={0.1 * timePerUnit} // Step relative to scale
                    min={-100}
                    max={100}
                    unit="Hz"
                />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Knob
                        label="Samples"
                        value={TotalSignalSamples}
                        onChange={(val) => {
                            // Ensure we don't exceed maxSamples if provided
                            const clamped = maxSamples ? Math.min(val, maxSamples) : val;
                            updateGlobal('TotalSignalSamples', clamped);
                        }}
                        step={10}
                        min={10}
                        max={maxSamples || 5000}
                        stepType="linear"
                    />
                    {maxSamples && (
                        <div style={{ fontSize: '10px', color: '#aaa', marginTop: '2px' }}>
                            Max: {maxSamples}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ControlPanelTime;
