import React from 'react';
import classNames from 'classnames';
import Knob from './subcomponents/Knob';

const ControlPanelChannel = ({ channel, onUpdate }) => {
    const updateChannel = (updates) => {
        onUpdate(channel.id, updates);
    };

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
                <div className="channel-controls">
                    <div className="control-row" style={{ justifyContent: 'space-around', alignItems: 'flex-start' }}>
                        <Knob
                            label="Volts/Div"
                            value={channel.voltsPerUnit}
                            onChange={(val) => updateChannel({ voltsPerUnit: val })}
                            stepType="1-2-5"
                            color={channel.color}
                        />
                        <Knob
                            label="Offset"
                            value={channel.offset}
                            onChange={(val) => updateChannel({ offset: val })}
                            min={-10}
                            max={10}
                            step={0.5}
                            stepType="linear"
                            color={channel.color}
                        />
                    </div>

                    <div className="control-row" style={{ marginTop: '10px', justifyContent: 'center', gap: '10px' }}>
                        <button
                            className={classNames('toggle-btn', { active: channel.acMode })}
                            onClick={() => updateChannel({ acMode: !channel.acMode })}
                        >
                            {channel.acMode ? 'AC' : 'DC'}
                        </button>
                        <button
                            className={classNames('toggle-btn', { active: channel.noiseFilter })}
                            onClick={() => updateChannel({ noiseFilter: !channel.noiseFilter })}
                        >
                            Filter
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ControlPanelChannel;
