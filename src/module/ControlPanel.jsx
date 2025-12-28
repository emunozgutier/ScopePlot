import React from 'react';
import classNames from 'classnames';
import { performAutoSet } from './submodule1/AutoSet';
import ControlPanelTime from './submodule1/ControlPanelTime';
import ControlPanelChannel from './submodule1/ControlPanelChannel';
import { useControlPanelStore } from '../stores/useControlPanelStore';
import { useSignalStore } from '../stores/useSignalStore';

const ControlPanel = () => {
    const { controlPanelData, updateControlPanelData, setTimeDomain } = useControlPanelStore();
    const { displayData } = useSignalStore();
    const signalData = displayData.signalData;

    const handleGlobalUpdate = (newData) => {
        updateControlPanelData(newData);
    };

    const handleAutoSet = () => {
        const newData = performAutoSet(controlPanelData, signalData);
        handleGlobalUpdate(newData);
    };

    const handleChannelUpdate = (chId, newData) => {
        const newChannels = controlPanelData.channels.map(ch =>
            ch.id === chId ? { ...ch, ...newData } : ch
        );
        updateControlPanelData({ ...controlPanelData, channels: newChannels });
    };

    const onFreqDomain = () => {
        // Toggle domain
        setTimeDomain(!controlPanelData.timeDomain);
    };

    // Calculate Max Samples based on signal data
    const channelStats = controlPanelData.channels
        .filter(ch => ch.visible)
        .map(ch => {
            const sig = signalData.find(s => s.id === ch.id);
            // If we have timeData, use its length, otherwise default to something or 0?
            // If simulating, it might be dynamic. If static, it's fixed.
            // Let's assume timeData.length is the source of truth for "available samples".
            // However, the user wants "Max:". If it's a generated signal, we might need a theoretical max?
            // "on samples there is a max". Usually this refers to the memory depth or the loaded file size.
            // For now, let's use timeData.length.
            const max = sig && sig.timeData ? sig.timeData.length : 0;
            return {
                id: ch.id,
                color: ch.color,
                maxSamples: max
            };
        });

    // The knob should be clamped to the maximum AVAILABLE samples across all channels.
    // Or is it the maximum possible? "make sure you can't select more than the max max".
    // If Ch1 has 1000 pts and Ch2 has 5000 pts, "max max" is 5000.
    const maxSamples = channelStats.length > 0
        ? Math.max(...channelStats.map(s => s.maxSamples))
        : 5000; // Default fallback if no channels visible

    return (
        <div className="control-panel" style={{ width: '300px', backgroundColor: '#222', padding: '10px', overflowY: 'auto' }}>
            <h2 style={{ color: 'white', marginTop: 0 }}>Controls</h2>

            {/* Global Controls */}
            <div className="panel-section">
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 className="panel-header" style={{ marginBottom: 0 }}>Global</h3>
                    <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={handleAutoSet}>
                        Auto Set
                    </button>
                    <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={onFreqDomain}>
                        Freq Domain
                    </button>
                </div>
            </div>

            <ControlPanelTime
                controlPanelData={controlPanelData}
                onUpdate={handleGlobalUpdate}
                maxSamples={maxSamples}
                channelStats={channelStats}
            />

            {controlPanelData.channels.map(ch => (
                <ControlPanelChannel
                    key={ch.id}
                    channel={ch}
                    onUpdate={handleChannelUpdate}
                />
            ))}
        </div>
    );
};

export default ControlPanel;
