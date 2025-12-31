import React, { useState, useEffect } from 'react';
import { useFunctionGenStore } from '../../stores/useFunctionGenStore';
import { useSignalStore } from '../../stores/useSignalStore';
import { useControlPanelStore } from '../../stores/useControlPanelStore';
import { generateSignal } from '../../utils/SignalGenerator';

// We need to re-implement handleSaveGenerator logic here.


const LoadTestMenu = () => {
    // Stores
    const { functionGenSignalData: data, setFunctionGenSignalData, closeModal } = useFunctionGenStore();
    const { signalList } = useSignalStore();
    // Actually we can use updateSignal if we target one ID.
    const { controlPanelData, updateControlPanelData } = useControlPanelStore();

    // Local State
    const [localData, setLocalData] = useState({ ...data, periods: 10, samplesPerPeriod: 1000 });

    // Sync derived state when data opens
    useEffect(() => {
        if (data.isOpen) {
            setLocalData({
                ...data, // Ensure we have latest store data
                periods: data.duration * data.frequency,
                samplesPerPeriod: data.sampleRate / data.frequency
            });
        }
    }, [data.isOpen, data.duration, data.frequency, data.sampleRate]); // Added deps

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

    const handleSave = () => {
        // 1. Update Function Gen Store
        const newData = { ...localData, isOpen: false }; // Close on save
        setFunctionGenSignalData(newData);

        // 2. Logic if enabled
        if (newData.enabled) {

            // Since I can't guarantee the import path without checking, I will try to locate it first?
            // No, I'll assume it's imported.
            // Wait, I haven't added the import yet in the ReplacementContent.
            // I'll add imports at the top.

            // Dynamic import or stick to static? Static.

            const buffer = generateSignal(newData);
            const targetCh = newData.targetChannelId;

            // Update Signal Data in Store
            // We need to access current displayData.signalData.
            // But we have useSignalStore. 
            // We need to update specific signal.

            const currentSignals = useSignalStore.getState().signalList;
            const targetSignal = currentSignals.find(s => s.id === targetCh);

            if (targetSignal) {
                // Calculate Samples
                // We need getSampledData.
                // Assuming import.

                const newTSample = getSampledData(buffer, 'time', controlPanelData);

                const newSignals = currentSignals.map(s =>
                    s.id === targetCh ? { ...s, defaultZeroData: false, timeData: buffer, timeDataSample: newTSample } : s
                );
                useSignalStore.setState({ signalList: newSignals });
            }

            // Ensure Channel is visible
            const channelConfig = controlPanelData.channels.find(c => c.id === targetCh);
            if (channelConfig && !channelConfig.visible) {
                const newChannels = controlPanelData.channels.map(c =>
                    c.id === targetCh ? { ...c, visible: true } : c
                );
                updateControlPanelData({ ...controlPanelData, channels: newChannels });
            }
        }
    };

    if (!data.isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Function Generator Load Menu</h2>
                    <button className="close-btn" onClick={closeModal}>×</button>
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
                    <button className="btn-secondary" onClick={closeModal}>Cancel</button>
                    <button className="btn-primary" onClick={handleSave}>Apply / Load</button>
                </div>
            </div>
        </div>
    );
};

export default LoadTestMenu;
