import React from 'react';
import { useSignalStore } from '../../stores/useSignalStore';
import { useControlPanelStore } from '../../stores/useControlPanelStore';
import classNames from 'classnames';

const CursorControlPanel = () => {
    const {
        cursor,
        signalList,
        setCursorChannel,
        moveCursor
    } = useSignalStore();

    const { controlPanelData } = useControlPanelStore();
    const { channels, timeDomain } = controlPanelData;

    const handleChannelSelect = (id) => {
        setCursorChannel(id);
    };

    const handleMove = (direction) => {
        moveCursor(direction);
    };

    // Get current cursor values
    const currentIndex = cursor.index;
    const isFreqDomain = !timeDomain; // timeDomain true means Time Domain

    // Helper to get value for a channel at cursor index
    const getChannelValue = (channelId) => {
        const signal = signalList.find(s => s.id === channelId);
        if (!signal) return { x: '0.00', y: '0.00' };

        const data = isFreqDomain ? signal.frequencyData : signal.timeData;
        if (!data || currentIndex >= data.length) return { x: '0.00', y: '0.00' };

        const point = data[currentIndex];
        // Point is [x, y]
        return {
            x: point[0],
            y: point[1]
        };
    };

    // X-Axis Label
    const xLabel = isFreqDomain ? 'Hz' : 's';
    const activeChannelId = cursor.channelId;
    const activeValue = getChannelValue(activeChannelId);

    return (
        <div className="cursor-panel" style={{ color: 'white' }}>
            <h3 style={{ borderBottom: '1px solid #444', paddingBottom: '5px' }}>Cursor Control</h3>

            {/* Channel Selection */}
            <div style={{ marginBottom: '15px' }}>
                <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>Select Channel</div>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {channels.map(ch => (
                        <button
                            key={ch.id}
                            onClick={() => handleChannelSelect(ch.id)}
                            style={{
                                backgroundColor: activeChannelId === ch.id ? ch.color : '#333',
                                color: activeChannelId === ch.id ? 'black' : 'white',
                                border: '1px solid #555',
                                padding: '4px 8px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                opacity: ch.visible ? 1 : 0.5
                            }}
                        >
                            CH{ch.id + 1}
                        </button>
                    ))}
                </div>
            </div>

            {/* Position Controls */}
            <div style={{ marginBottom: '15px' }}>
                <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>Position</div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                        className="btn-secondary"
                        onClick={() => handleMove(-1)}
                        style={{ padding: '5px 10px' }}
                    >
                        &lt; Left
                    </button>
                    <button
                        className="btn-secondary"
                        onClick={() => handleMove(1)}
                        style={{ padding: '5px 10px' }}
                    >
                        Right &gt;
                    </button>
                </div>
                <div style={{ marginTop: '5px', fontSize: '14px' }}>
                    X: {activeValue.x.toFixed(4)} {xLabel}
                </div>
            </div>

            {/* Values Table */}
            <div>
                <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px', borderBottom: '1px solid #333' }}>Values at Cursor</div>
                {channels.map(ch => {
                    if (!ch.visible) return null;
                    const val = getChannelValue(ch.id);
                    return (
                        <div key={ch.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                            <span style={{ color: ch.color }}>CH{ch.id + 1}</span>
                            <span>{val.y.toFixed(4)} {isFreqDomain ? '' : 'V'}</span>
                        </div>
                    );
                })}
            </div>

        </div>
    );
};

export default CursorControlPanel;
