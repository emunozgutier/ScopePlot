import React from 'react';
import Knob from './submodule2/Knob';

const ControlPanelTime = ({ controlPanelData, onUpdate, maxSamples, channelStats }) => {
    const {
        timePerUnit, freqPerUnit,
        timeOffset, freqOffset,
        TotalSignalSamples, timeDomain
    } = controlPanelData;

    const updateGlobal = (key, value) => {
        onUpdate({
            ...controlPanelData,
            [key]: value
        });
    };

    const isTime = timeDomain !== false;

    // Select values based on domain
    const unitKey = isTime ? 'timePerUnit' : 'freqPerUnit';
    const offsetKey = isTime ? 'timeOffset' : 'freqOffset';

    const currentValue = isTime ? timePerUnit : freqPerUnit;
    const currentOffset = isTime ? (timeOffset || 0) : (freqOffset || 0);

    const headerTitle = isTime ? "Time Base" : "Freq Base";
    const unitScale = isTime ? "s" : "Hz";
    const labelScale = isTime ? "Time/Div" : "Freq/Div";

    // Constraints
    const minScale = isTime ? 0.001 : 1;
    const maxScale = isTime ? 100 : 10000000;

    // Offset logic
    // Time: allowed panning. Freq: allowed panning? usually 0Hz at left.
    // Let's support it same way.
    const offsetStep = currentValue * 0.1;
    const offsetMin = -currentValue * 100;
    const offsetMax = currentValue * 100;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h3 style={{ margin: 0, color: 'white', borderBottom: '1px solid #555', paddingBottom: '5px' }}>{headerTitle}</h3>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                <Knob
                    label={labelScale}
                    value={currentValue}
                    onChange={(val) => updateGlobal(unitKey, val)}
                    stepType="1-2-5"
                    min={minScale}
                    max={maxScale}
                    unit={unitScale}
                />
                <Knob
                    label="Offset"
                    value={currentOffset}
                    onChange={(val) => updateGlobal(offsetKey, val)}
                    step={offsetStep}
                    min={offsetMin}
                    max={offsetMax}
                    unit={unitScale}
                />
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Knob
                            label="Samples"
                            value={TotalSignalSamples}
                            onChange={(val) => {
                                updateGlobal('TotalSignalSamples', val);
                            }}
                            stepType="powerOf2"
                            min={16}
                            max={131072}
                        />
                        {maxSamples && (
                            <div style={{ fontSize: '10px', color: '#aaa', marginTop: '2px' }}>
                                Signal Length: {maxSamples}
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
