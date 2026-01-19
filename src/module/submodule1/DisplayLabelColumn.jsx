import React from 'react';
import { useControlPanelStore } from '../../stores/useControlPanelStore';
import DisplayOffsetTab from './submodule2/DisplayOffsetTab';

const DisplayLabelColumn = () => {
    const { controlPanelData, updateControlPanelData } = useControlPanelStore();
    const showFrequency = !controlPanelData.timeDomain;

    const handleChannelUpdate = (channelId, updates) => {
        const newChannels = controlPanelData.channels.map(ch =>
            ch.id === channelId ? { ...ch, ...updates } : ch
        );
        updateControlPanelData({ ...controlPanelData, channels: newChannels });
    };

    return (
        <div
            style={{
                width: '50px',
                height: 'calc(100% - 28px)',
                marginTop: '14px',
                position: 'relative',
                backgroundColor: '#111',
                borderRight: '1px solid #333',
                overflow: 'hidden'
            }}
        >
            {controlPanelData.channels.map(ch => (
                <DisplayOffsetTab
                    key={ch.id}
                    channel={ch}
                    onUpdate={(updates) => handleChannelUpdate(ch.id, updates)}
                    isFreqDomain={showFrequency}
                />
            ))}
        </div>
    );
};

export default DisplayLabelColumn;
