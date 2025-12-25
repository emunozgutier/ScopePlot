export const performAutoSet = (controlPanelData, signalData) => {
    const visibleChannels = controlPanelData.channels.filter(ch => ch.visible);
    const activeSignals = signalData.filter(sig =>
        visibleChannels.some(ch => ch.id === sig.id) && sig.voltageTimeData.length > 0
    );

    if (activeSignals.length === 0) return controlPanelData;

    // 1. Time Logic
    let maxTime = 0;
    activeSignals.forEach(sig => {
        const lastPoint = sig.voltageTimeData[sig.voltageTimeData.length - 1];
        if (lastPoint && lastPoint[0] > maxTime) maxTime = lastPoint[0];
    });

    // Set Time/Div to fit maxTime in 10 units
    // If maxTime is very small (e.g. 0), keep default.
    const newTimePerUnit = maxTime > 0 ? maxTime / 10 : controlPanelData.timePerUnit;

    // 2. Voltage Logic
    const newChannels = controlPanelData.channels.map(ch => {
        if (!ch.visible) return ch;
        const sig = signalData.find(s => s.id === ch.id);
        if (!sig || sig.voltageTimeData.length === 0) return ch;

        let minV = Infinity;
        let maxV = -Infinity;

        // Analyze raw voltage
        sig.voltageTimeData.forEach(([_, v]) => {
            if (v < minV) minV = v;
            if (v > maxV) maxV = v;
        });

        if (minV === Infinity) return ch;

        const range = maxV - minV;
        const center = (maxV + minV) / 2;

        // Grid Height is 8 units. We want signal to cover ~6 units?
        // Volts/Unit = Range / 6
        let newVoltsPerUnit = range > 0 ? range / 6 : 1;

        // Offset Logic:
        // Y = 4 - (v + offset) / voltsPerUnit
        // We want 'center' to be at Y=4 (Screen Center).
        // 4 = 4 - (center + offset) / voltsPerUnit -> center + offset = 0 -> offset = -center.
        const newOffset = -center;

        return { ...ch, voltsPerUnit: newVoltsPerUnit, offset: newOffset };
    });

    return {
        ...controlPanelData,
        timePerUnit: newTimePerUnit,
        channels: newChannels
    };
};
