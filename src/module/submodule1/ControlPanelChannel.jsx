import React from 'react';
import classNames from 'classnames';
import Knob from './submodule2/Knob';
import { formatMetric } from '../../utils/KnobNumber';

const ControlPanelChannel = ({ channel, onUpdate, isFreq }) => {
    const updateChannel = (updates) => {
        onUpdate(channel.id, updates);
    };

    // Determine correct keys based on domain
    const voltsKey = isFreq ? 'voltsPerUnitFreqDomain' : 'voltsPerUnitTimeDomain';
    const offsetKey = isFreq ? 'offsetFreqDomain' : 'offsetTimeDomain';

    const currentVolts = channel[voltsKey];
    const currentOffset = channel[offsetKey];

    // Offset Constraints
    // Step = 0.1 * Volts/Div
    const offsetStep = currentVolts * 0.1;
    // Min/Max = +/- 4 * Volts/Div (4 divisions)
    const offsetLimit = currentVolts * 4;

    const labelUnit = isFreq ? "Mag/Div" : "Volts/Div";
    // For offset, strict 4 div limit might be too restrictive if offset is large? 
    // Standard scope behavior is relative to screen. 4 divs is screen half-height.

    return (
        <div className="panel-section" style={{ borderLeft: `3px solid ${channel.color} ` }}>
            <div className="ch-header">
                <h3 className="panel-header" style={{ color: channel.color }}>Channel {channel.id + 1}</h3>
                <button
                    className={classNames('toggle-btn', { active: channel.visible })}
                    onClick={() => updateChannel({ visible: !channel.visible })}
                >
                    {channel.visible ? 'ON' : 'OFF'}
                </button>
            </div>

            {channel.visible && (
                <div className="channel-controls" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', width: '100%', padding: '5px' }}>



                    <div className="knobs-row" style={{ display: 'flex', gap: '80px', flex: 1, justifyContent: 'center' }}>
                        <Knob
                            label={labelUnit}
                            value={currentVolts}
                            onChange={(val) => updateChannel({ [voltsKey]: val })}
                            stepType="1-2-5"
                            color={channel.color}
                            format={(v) => formatMetric(v, isFreq ? '' : 'V')}
                        />
                        <Knob
                            label="Offset"
                            value={currentOffset}
                            onChange={(val) => updateChannel({ [offsetKey]: val })}
                            min={-offsetLimit}
                            max={offsetLimit}
                            step={offsetStep}
                            stepType="linear"
                            color={channel.color}
                            format={(v) => formatMetric(v, isFreq ? '' : 'V')}
                        />
                    </div>

                </div>
            )}
        </div>
    );
};

export default ControlPanelChannel;
