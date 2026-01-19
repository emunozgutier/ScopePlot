import React from 'react';
import DisplaySignal from './submodule2/DisplaySignal';
import DisplayCursor, { CursorOverlay } from './submodule2/DisplayCursor';
import DisplayLabel, { LabelOverlay } from './submodule2/DisplayLabel';
import { useControlPanelStore } from '../../stores/useControlPanelStore';
import { useSignalStore } from '../../stores/useSignalStore';

const DisplayGraph = () => {
    const { controlPanelData } = useControlPanelStore();
    const { signalList, labels } = useSignalStore();

    const widthUnits = 10;
    const heightUnits = 8;
    const showFrequency = !controlPanelData.timeDomain;

    return (
        <div className="scope-display" style={{ flex: 1, position: 'relative' }}>
            <div className="grid-background" />


            <svg
                viewBox={`0 0 ${widthUnits} ${heightUnits}`}
                className="signal-layer"
                preserveAspectRatio="none"
                style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
            >
                {signalList.map((sig) => (
                    <DisplaySignal
                        key={sig.id}
                        displaySignalData={sig}
                        controlPanelData={controlPanelData}
                    />
                ))}
                <DisplayCursor />
            </svg>
            {labels.map(label => (
                <DisplayLabel key={label.id} label={label} />
            ))}

            <CursorOverlay widthUnits={widthUnits} />
            <LabelOverlay widthUnits={widthUnits} heightUnits={heightUnits} />

            {/* Overlay */}
            <div style={{ color: 'white' }}>
                {showFrequency
                    ? `Freq/Div: ${controlPanelData.freqPerUnit} Hz`
                    : `Time/Div: ${controlPanelData.timePerUnit}s`
                }
            </div>
            <div style={{ color: 'white' }}>
                {showFrequency
                    ? `Nyquist: ${(controlPanelData.TotalSignalSamples / (controlPanelData.timePerUnit * 10) / 2).toFixed(1)} Hz`
                    : `Total Samples: ${controlPanelData.TotalSignalSamples}`
                }
            </div>
            {controlPanelData.channels.map(ch => ch.visible && (
                <div key={ch.id} style={{ color: ch.color }}>
                    {showFrequency
                        ? `CH${ch.id + 1}: ${(ch.voltsPerUnitFreqDomain || 1).toPrecision(3)} Mag/Div`
                        : `CH${ch.id + 1}: ${ch.voltsPerUnitTimeDomain} V/Div`
                    }
                </div>
            ))}
        </div>
    );
};

export default DisplayGraph;

