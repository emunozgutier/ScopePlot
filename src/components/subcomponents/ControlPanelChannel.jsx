import React from 'react';
import classNames from 'classnames';
import Knob from './subcomponents/Knob';
import { formatMetric } from './subcomponents/KnobNumber';

const ControlPanelChannel = ({ channel, onUpdate }) => {
    const updateChannel = (updates) => {
        onUpdate(channel.id, updates);
    };

    // Offset Constraints
    // Step = 0.1 * Volts/Div
    const offsetStep = channel.voltsPerUnit * 0.1;
    // Min/Max = +/- 4 * Volts/Div (4 divisions)
    const offsetLimit = channel.voltsPerUnit * 4;

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

                    <div className="control-column" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button
                            className={classNames('toggle-btn', { active: channel.acMode })}
                            onClick={() => updateChannel({ acMode: !channel.acMode })}
                            style={{ fontSize: '10px', padding: '4px 8px', width: '50px' }}
                        >
                            {channel.acMode ? 'AC' : 'DC'}
                        </button>
                        <button
                            className={classNames('toggle-btn', { active: channel.noiseFilter })}
                            onClick={() => updateChannel({ noiseFilter: !channel.noiseFilter })}
                            style={{ fontSize: '10px', padding: '4px 8px', width: '50px' }}
                        >
                            Filter
                        </button>
                    </div>

                    <div className="knobs-row" style={{ display: 'flex', gap: '80px', flex: 1, justifyContent: 'center' }}>
                        <Knob
                            label="Volts/Div"
                            value={channel.voltsPerUnit}
                            onChange={(val) => updateChannel({ voltsPerUnit: val })}
                            stepType="1-2-5"
                            color={channel.color}
                            format={(v) => formatMetric(v, 'V')}
                        />
                        <Knob
                            label="Offset"
                            value={channel.offset}
                            onChange={(val) => updateChannel({ offset: val })}
                            min={-offsetLimit}
                            max={offsetLimit}
                            step={offsetStep}
                            stepType="linear"
                            color={channel.color}
                            format={(v) => formatMetric(v, 'V')}
                        />
                    </div>

                </div>
            )}
        </div>
    );
};

export default ControlPanelChannel;
