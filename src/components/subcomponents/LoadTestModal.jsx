import React, { useState, useEffect } from 'react';

const LoadTestModal = ({ data, onSave, onClose }) => {
    const [localData, setLocalData] = useState({ ...data, periods: 10, samplesPerPeriod: 1000 });

    // Sync derived state when data opens
    useEffect(() => {
        setLocalData({
            ...data,
            periods: data.duration * data.frequency,
            samplesPerPeriod: data.sampleRate / data.frequency
        });
    }, [data.isOpen]);

    const handleChange = (field, value) => {
        const newData = { ...localData, [field]: value };

        // Dependent Logic
        if (field === 'frequency') {
            newData.periods = newData.duration * value;
            newData.samplesPerPeriod = newData.sampleRate / value;
        }

        // Time <-> Periods
        if (field === 'duration') {
            newData.periods = value * newData.frequency;
        } else if (field === 'periods') {
            newData.duration = value / (newData.frequency || 1);
        }

        // Rate <-> SPP
        if (field === 'sampleRate') {
            newData.samplesPerPeriod = value / (newData.frequency || 1);
        } else if (field === 'samplesPerPeriod') {
            newData.sampleRate = value * newData.frequency;
        }

        setLocalData(newData);
    };

    if (!data.isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Function Generator Load Test</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="modal-row">
                    <label>
                        <input
                            type="checkbox"
                            checked={localData.enabled}
                            onChange={(e) => handleChange('enabled', e.target.checked)}
                        /> Enable Signal
                    </label>
                </div>

                <div className="modal-row">
                    <label>Target Channel</label>
                    <select
                        value={localData.targetChannelId}
                        onChange={(e) => handleChange('targetChannelId', parseInt(e.target.value))}
                    >
                        {[0, 1, 2, 3].map(id => <option key={id} value={id}>Channel {id + 1}</option>)}
                    </select>
                </div>

                <div className="modal-row">
                    <label>Shape</label>
                    <select
                        value={localData.shape}
                        onChange={(e) => handleChange('shape', e.target.value)}
                    >
                        <option value="sine">Sine</option>
                        <option value="square">Square</option>
                        <option value="triangle">Triangle</option>
                    </select>
                </div>

                <div className="modal-row">
                    <label>Frequency (Hz)</label>
                    <input
                        type="number" step="0.1"
                        value={localData.frequency}
                        onChange={(e) => handleChange('frequency', parseFloat(e.target.value))}
                    />
                </div>

                <div className="modal-row">
                    <label>Amplitude (V)</label>
                    <input
                        type="number" step="0.1"
                        value={localData.amplitude}
                        onChange={(e) => handleChange('amplitude', parseFloat(e.target.value))}
                    />
                </div>

                <div className="dual-input-row">
                    <div className="dual-input-group">
                        <label>Duration (s)</label>
                        <input
                            type="number" step="0.1"
                            value={localData.duration}
                            onChange={(e) => handleChange('duration', parseFloat(e.target.value))}
                        />
                    </div>
                    <div className="dual-input-group">
                        <label>Periods</label>
                        <input
                            type="number" step="0.1"
                            value={localData.periods.toFixed(2)}
                            onChange={(e) => handleChange('periods', parseFloat(e.target.value))}
                        />
                    </div>
                </div>

                <div className="dual-input-row">
                    <div className="dual-input-group">
                        <label>Sample Rate (Hz)</label>
                        <input
                            type="number" step="10"
                            value={localData.sampleRate}
                            onChange={(e) => handleChange('sampleRate', parseFloat(e.target.value))}
                        />
                    </div>
                    <div className="dual-input-group">
                        <label>Samples/Period</label>
                        <input
                            type="number" step="1"
                            value={localData.samplesPerPeriod.toFixed(2)}
                            onChange={(e) => handleChange('samplesPerPeriod', parseFloat(e.target.value))}
                        />
                    </div>
                </div>

                <div className="modal-actions">
                    <button className="btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn-primary" onClick={() => onSave(localData)}>Apply / Load</button>
                </div>
            </div>
        </div>
    );
};

export default LoadTestModal;
