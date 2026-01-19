import { snapTo125 } from './KnobNumber';

export const performAutoSet = (controlPanelData, signalList) => {
    const visibleChannels = controlPanelData.channels.filter(ch => ch.visible);
    const activeSignals = signalList.filter(sig =>
        visibleChannels.some(ch => ch.id === sig.id) &&
        (controlPanelData.timeDomain ? (sig.timeData?.length > 0) : (sig.frequencyData?.length > 0))
    );

    if (activeSignals.length === 0) return controlPanelData;

    // --- Frequency Domain AutoSet ---
    console.log("AutoSet Started. Domain:", controlPanelData.timeDomain ? "Time" : "Frequency");

    // --- Frequency Domain AutoSet ---
    if (!controlPanelData.timeDomain) {
        console.log("Processing Frequency Domain AutoSet...");

        let globalMaxMag = 0;
        activeSignals.forEach(sig => {
            sig.frequencyData.forEach(d => {
                if (d[1] > globalMaxMag) globalMaxMag = d[1];
            });
        });
        console.log("Global Max Magnitude:", globalMaxMag);

        let significantMaxFreq = 0;
        activeSignals.forEach(sig => {
            sig.frequencyData.forEach(d => {
                if (d[1] > globalMaxMag * 0.05) {
                    if (d[0] > significantMaxFreq) significantMaxFreq = d[0];
                }
            });
        });
        console.log("Significant Max Freq (>5% Mag):", significantMaxFreq);

        if (significantMaxFreq === 0) {
            activeSignals.forEach(sig => {
                const lastPoint = sig.frequencyData[sig.frequencyData.length - 1];
                if (lastPoint && lastPoint[0] > significantMaxFreq) significantMaxFreq = lastPoint[0];
            });
            console.log("No significant signal found. Using Max Available Freq:", significantMaxFreq);
        }
        // We want 'significantMaxFreq' to be at roughly the 9th division (near right edge)
        // Display Range = freqPerUnit * 10
        // freqPerUnit = significantMaxFreq / 9

        const newFreqPerUnit = (significantMaxFreq > 0) ? significantMaxFreq / 9 : controlPanelData.freqPerUnit;
        const snappedFreqPerUnit = snapTo125(newFreqPerUnit);

        console.log(`Calculated Freq/Div: ${newFreqPerUnit} -> Snapped: ${snappedFreqPerUnit}`);

        // 2. Vertical Logic
        const newChannels = controlPanelData.channels.map(ch => {
            if (!ch.visible) return ch;
            const sig = signalList.find(s => s.id === ch.id);
            if (!sig || !sig.frequencyData || sig.frequencyData.length === 0) {
                console.log(`CH${ch.id + 1}: No Freq Data`);
                return ch;
            }

            let maxMag = 0;
            sig.frequencyData.forEach(d => {
                if (d[1] > maxMag) maxMag = d[1];
            });
            console.log(`CH${ch.id + 1} Max Mag: ${maxMag}`);

            if (maxMag === 0) return ch;

            let newVoltsPerUnit = (maxMag * 10) / 4.8;
            newVoltsPerUnit = snapTo125(newVoltsPerUnit);

            console.log(`CH${ch.id + 1} New Mag/Div: ${newVoltsPerUnit}`);

            return { ...ch, voltsPerUnitFreqDomain: newVoltsPerUnit, offsetFreqDomain: 0 };
        });

        return {
            ...controlPanelData,
            freqPerUnit: snappedFreqPerUnit,
            freqOffset: 0,
            channels: newChannels
        };
    }

    // --- Time Domain AutoSet (Existing Logic) ---
    console.log("Processing Time Domain AutoSet...");

    // 1. Time Logic
    let activeMaxTime = 0;
    activeSignals.forEach(sig => {
        const vData = sig.timeData;
        const lastPoint = vData[vData.length - 1];
        if (lastPoint && lastPoint[0] > activeMaxTime) activeMaxTime = lastPoint[0];
    });
    console.log("Global Max Time:", activeMaxTime);

    let newTimePerUnit = activeMaxTime > 0 ? activeMaxTime / 10 : controlPanelData.timePerUnit;
    newTimePerUnit = snapTo125(newTimePerUnit);
    console.log(`Calculated Time/Div: ${activeMaxTime / 10} -> Snapped: ${newTimePerUnit}`);

    // 2. Voltage Logic
    const newChannels = controlPanelData.channels.map(ch => {
        if (!ch.visible) return ch;
        const sig = signalList.find(s => s.id === ch.id);

        if (!sig || !sig.timeData || sig.timeData.length === 0) {
            console.log(`CH${ch.id + 1}: No Time Data`);
            return ch;
        }

        let minV = Infinity;
        let maxV = -Infinity;

        sig.timeData.forEach(([_, v]) => {
            if (v < minV) minV = v;
            if (v > maxV) maxV = v;
        });

        console.log(`CH${ch.id + 1} Range: [${minV.toFixed(3)} V, ${maxV.toFixed(3)} V]`);

        if (minV === Infinity) return ch;

        const range = maxV - minV;
        const center = (maxV + minV) / 2;

        let newVoltsPerUnit = range > 0 ? range / 4.8 : 1;
        newVoltsPerUnit = snapTo125(newVoltsPerUnit);

        const newOffset = -center;

        console.log(`CH${ch.id + 1} New Volts/Div: ${newVoltsPerUnit}, Offset: ${newOffset.toFixed(3)}`);

        return { ...ch, voltsPerUnitTimeDomain: newVoltsPerUnit, offsetTimeDomain: newOffset };
    });

    let minTime = Infinity;
    activeSignals.forEach(sig => {
        const firstPoint = sig.timeData[0];
        if (firstPoint && firstPoint[0] < minTime) minTime = firstPoint[0];
    });
    const newTimeOffset = minTime !== Infinity ? -minTime : 0;
    console.log("New Time Offset:", newTimeOffset);

    return {
        ...controlPanelData,
        timePerUnit: newTimePerUnit,
        timeOffset: newTimeOffset,
        channels: newChannels
    };
};
