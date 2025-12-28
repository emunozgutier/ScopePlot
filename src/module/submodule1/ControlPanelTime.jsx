import React from 'react';
import Knob from './submodule2/Knob';

const ControlPanelTime = ({ controlPanelData, onUpdate, maxSamples, channelStats }) => {
    const { timePerUnit, TotalSignalSamples, timeOffset, timeDomain } = controlPanelData;

    const updateGlobal = (key, value) => {
        onUpdate({
            ...controlPanelData,
            [key]: value
        });
    };

    const isTime = timeDomain !== false; // Default to true if undefined, though it should be defined
    const headerTitle = isTime ? "Time Base" : "Frequency";
    const unitScale = isTime ? "s" : "Hz";
    const labelScale = isTime ? "Time/Div" : "Freq/Div";

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h3 style={{ margin: 0, color: 'white', borderBottom: '1px solid #555', paddingBottom: '5px' }}>{headerTitle}</h3>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                <Knob
                    label={labelScale}
                    value={timePerUnit}
                    onChange={(val) => updateGlobal('timePerUnit', val)}
                    stepType="1-2-5"
                    min={0.001}
                    max={100}
                    unit={unitScale}
                />
                <Knob
                    label="Offset"
                    value={timeOffset || 0}
                    onChange={(val) => updateGlobal('timeOffset', val)}
                    step={0.1 * timePerUnit} // Step relative to scale
                    min={-100}
                    max={100}
                    unit={unitScale}
                />
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Knob
                            label="Samples"
                            value={TotalSignalSamples}
                            onChange={(val) => {
                                // Ensure we don't exceed maxSamples if provided
                                const clamped = maxSamples ? Math.min(val, maxSamples) : val;
                                updateGlobal('TotalSignalSamples', clamped);
                            }}
                            stepType="powerOf2"
                            min={16}
                            max={maxSamples || 8192}
                        />
                        {maxSamples && (
                            <div style={{ fontSize: '10px', color: '#aaa', marginTop: '2px' }}>
                                Max: {maxSamples}
                            </div>
                        )}
                    </div>
                    {channelStats && channelStats.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', marginTop: '15px' }}>
                            {channelStats.map(stat => (
                                <div key={stat.id} style={{ fontSize: '10px', color: stat.color, marginBottom: '2px' }}>
                                    Max: {stat.maxSamples}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ControlPanelTime;
