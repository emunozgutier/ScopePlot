import { snapTo125 } from './submodule2/KnobNumber';

export const performAutoSet = (controlPanelData, signalList) => {
    const visibleChannels = controlPanelData.channels.filter(ch => ch.visible);
    const activeSignals = signalList.filter(sig =>
        visibleChannels.some(ch => ch.id === sig.id) && sig.timeData?.length > 0
    );

    if (activeSignals.length === 0) return controlPanelData;

    // 1. Time Logic
    let activeMaxTime = 0;
    activeSignals.forEach(sig => {
        const vData = sig.timeData;
        const lastPoint = vData[vData.length - 1];
        if (lastPoint && lastPoint[0] > activeMaxTime) activeMaxTime = lastPoint[0];
    });

    // Set Time/Div to fit maxTime in 10 units
    // If maxTime is very small (e.g. 0), keep default.
    let newTimePerUnit = activeMaxTime > 0 ? activeMaxTime / 10 : controlPanelData.timePerUnit;

    // Snap Time to 1-2-5
    newTimePerUnit = snapTo125(newTimePerUnit);


    // 2. Voltage Logic
    const newChannels = controlPanelData.channels.map(ch => {
        if (!ch.visible) return ch;
        const sig = signalList.find(s => s.id === ch.id);

        // Safety check for signal data
        if (!sig || !sig.timeData || sig.timeData.length === 0) return ch;

        let minV = Infinity;
        let maxV = -Infinity;

        // Analyze raw voltage
        sig.timeData.forEach(([_, v]) => {
            if (v < minV) minV = v;
            if (v > maxV) maxV = v;
        });

        if (minV === Infinity) return ch;

        const range = maxV - minV;
        const center = (maxV + minV) / 2;

        // Grid Height is 8 units. We want signal to cover ~6 units?
        // Volts/Unit = Range / 6
        let newVoltsPerUnit = range > 0 ? range / 6 : 1;

        // Snap Volts to 1-2-5
        newVoltsPerUnit = snapTo125(newVoltsPerUnit);

        // Offset Logic:
        // Y = 4 - (v + offset) / voltsPerUnit
        // We want 'center' to be at Y=4 (Screen Center).
        // 4 = 4 - (center + offset) / voltsPerUnit -> center + offset = 0 -> offset = -center.
        const newOffset = -center;

        return { ...ch, voltsPerUnit: newVoltsPerUnit, offset: newOffset };
    });

    // Compute min time for offset
    let minTime = Infinity;
    activeSignals.forEach(sig => {
        const firstPoint = sig.timeData[0];
        if (firstPoint && firstPoint[0] < minTime) minTime = firstPoint[0];
    });
    const newTimeOffset = minTime !== Infinity ? -minTime : 0;

    return {
        ...controlPanelData,
        timePerUnit: newTimePerUnit,
        timeOffset: newTimeOffset,
        channels: newChannels
    };
};
