import React from 'react';
import { useSignalStore } from '../../../stores/useSignalStore';
import { useControlPanelStore } from '../../../stores/useControlPanelStore';

const DisplayLabel = ({ label }) => {
    const { removeLabel, updateLabel } = useSignalStore();
    const { controlPanelData } = useControlPanelStore();
    const { timePerUnit, timeOffset, freqPerUnit, freqOffset, timeDomain } = controlPanelData;

    const { x, y, channelId, id, isFreq, position } = label;
    const channelConfig = controlPanelData.channels.find(ch => ch.id === channelId);

    if (channelConfig && !channelConfig.visible) return null;

    const color = channelConfig ? channelConfig.color : '#fff';

    if (isFreq !== !timeDomain) return null;

    // Calculate Position
    const widthUnits = 10;
    const heightUnits = 8;
    const voltsKey = isFreq ? 'voltsPerUnitFreqDomain' : 'voltsPerUnitTimeDomain';
    const offsetKey = isFreq ? 'offsetFreqDomain' : 'offsetTimeDomain';
    const voltsPerUnit = channelConfig ? channelConfig[voltsKey] : 1;
    const offset = channelConfig ? channelConfig[offsetKey] : 0;

    let xSvg, ySvg;
    if (isFreq) {
        const currentFreqScale = freqPerUnit || 1;
        const currentFreqOffset = freqOffset || 0;
        xSvg = (x + currentFreqOffset) / currentFreqScale;
        ySvg = 8 - ((y * 10) + offset) / voltsPerUnit;
    } else {
        xSvg = (x + (timeOffset || 0)) / timePerUnit;
        ySvg = 4 - (y + offset) / voltsPerUnit;
    }

    const leftPercent = (xSvg / widthUnits) * 100;
    const topPercent = (ySvg / heightUnits) * 100;

    const format = (val) => {
        if (val === 0) return "0";
        if (Math.abs(val) < 0.001 || Math.abs(val) >= 1000) return val.toExponential(2);
        return val.toFixed(3);
    };

    // Positioning Logic
    const currentPosition = position || 'top';
    const arrowSize = 6;
    const offsetDist = 10; // Distance from point

    // Styles for main container based on position
    let transform = '';
    let arrowStyle = {};

    switch (currentPosition) {
        case 'top':
            transform = `translate(-50%, -${100}%) translateY(-${offsetDist}px)`;
            arrowStyle = {
                bottom: '-6px',
                left: '50%',
                transform: 'translateX(-50%) rotate(45deg)',
                borderBottom: `1px solid ${color}`,
                borderRight: `1px solid ${color}`
            };
            break;
        case 'bottom':
            transform = `translate(-50%, 0) translateY(${offsetDist}px)`;
            arrowStyle = {
                top: '-6px',
                left: '50%',
                transform: 'translateX(-50%) rotate(225deg)',
                borderBottom: `1px solid ${color}`,
                borderRight: `1px solid ${color}`
            };
            break;
        case 'left':
            transform = `translate(-100%, -50%) translateX(-${offsetDist}px)`;
            arrowStyle = {
                right: '-6px',
                top: '50%',
                transform: 'translateY(-50%) rotate(315deg)', // Pointing right
                borderBottom: `1px solid ${color}`,
                borderRight: `1px solid ${color}`
            };
            break;
        case 'right':
            transform = `translate(0, -50%) translateX(${offsetDist}px)`;
            arrowStyle = {
                left: '-6px',
                top: '50%',
                transform: 'translateY(-50%) rotate(135deg)', // Pointing left
                borderBottom: `1px solid ${color}`,
                borderRight: `1px solid ${color}`
            };
            break;
        default:
            transform = 'translate(-50%, -100%)';
    }

    const handleRotate = (e) => {
        e.stopPropagation();
        const positions = ['top', 'right', 'bottom', 'left'];
        const nextIdx = (positions.indexOf(currentPosition) + 1) % 4;
        updateLabel(id, { position: positions[nextIdx] });
    };

    return (
        <div
            style={{
                position: 'absolute',
                left: `${leftPercent}%`,
                top: `${topPercent}%`,
                transform: transform,
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                border: `1px solid ${color}`,
                borderRadius: '4px',
                padding: '4px 6px',
                color: color,
                fontSize: '11px',
                whiteSpace: 'nowrap',
                zIndex: 30,
                pointerEvents: 'auto',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }}
            onClick={handleRotate}
            title="Click to rotate position"
        >
            {/* Arrow */}
            <div style={{
                position: 'absolute',
                width: '10px',
                height: '10px',
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                ...arrowStyle,
                zIndex: -1
            }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                    <span>X: {format(x)} {isFreq ? 'Hz' : 's'}</span>
                    <span>Y: {format(y)} {isFreq ? 'Mag' : 'V'}</span>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        removeLabel(id);
                    }}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#999',
                        cursor: 'pointer',
                        fontSize: '14px',
                        padding: '0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%'
                    }}
                    onMouseEnter={e => e.target.style.color = '#fff'}
                    onMouseLeave={e => e.target.style.color = '#999'}
                    title="Remove Label"
                >
                    ✕
                </button>
            </div>
        </div>
    );
};

export default DisplayLabel;

export const LabelOverlay = ({ widthUnits = 10, heightUnits = 8 }) => {
    const { signalList, addLabel, labelToolActive } = useSignalStore();
    const { controlPanelData } = useControlPanelStore();
    const overlayRef = React.useRef(null);
    const showFrequency = !controlPanelData.timeDomain;

    if (!labelToolActive) return null;

    const handlePointerDown = (e) => {
        const overlay = overlayRef.current;
        if (!overlay) return;

        const rect = overlay.getBoundingClientRect();
        const xPixels = e.clientX - rect.left;
        const yPixels = e.clientY - rect.top;
        const svgX = (xPixels / rect.width) * widthUnits;
        const svgY = (yPixels / rect.height) * heightUnits;

        // Find closest signal point
        let closestDist = Infinity;
        let closestPoint = null;
        let closestChannelId = null;

        controlPanelData.channels.forEach(ch => {
            if (!ch.visible) return;
            const sig = signalList.find(s => s.id === ch.id);
            if (!sig) return;

            const data = showFrequency ? sig.frequencyData : sig.timeData;
            if (!data) return;

            const scale = showFrequency ? (controlPanelData.freqPerUnit || 1) : (controlPanelData.timePerUnit || 1);
            const offset = showFrequency ? (controlPanelData.freqOffset || 0) : (controlPanelData.timeOffset || 0);
            const targetVal = svgX * scale - offset;

            // Find closest index by X
            let idx = 0;
            let minXDist = Infinity;
            for (let i = 0; i < data.length; i++) {
                const d = Math.abs(data[i][0] - targetVal);
                if (d < minXDist) { minXDist = d; idx = i; }
            }

            // Check Y distance in screen units
            const point = data[idx];

            let pointSvgY;
            if (showFrequency) {
                pointSvgY = 8 - ((point[1] * 10) + (ch.offsetFreqDomain || 0)) / (ch.voltsPerUnitFreqDomain || 1);
            } else {
                pointSvgY = 4 - (point[1] + (ch.offsetTimeDomain || 0)) / ch.voltsPerUnitTimeDomain;
            }

            const dist = Math.abs(svgY - pointSvgY);
            if (dist < closestDist) {
                closestDist = dist;
                closestPoint = point;
                closestChannelId = ch.id;
            }
        });

        if (closestPoint) {
            addLabel({
                id: Date.now(),
                x: closestPoint[0],
                y: closestPoint[1],
                channelId: closestChannelId,
                isFreq: showFrequency
            });
        }
    };

    return (
        <div
            ref={overlayRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                cursor: 'crosshair',
                touchAction: 'none'
            }}
            onPointerDown={handlePointerDown}
        />
    );
};

