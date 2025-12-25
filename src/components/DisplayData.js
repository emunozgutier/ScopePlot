export const DEFAULT_SIGNAL_DATA = {
    id: 0,
    defaultZeroData: true,
    voltageTimeData: [], // Array of [time, voltage]
    OriginalVoltageTimeData: [] // Loaded/Generated static data
};

export const initialDisplayData = {
    signalData: [
        { ...DEFAULT_SIGNAL_DATA, id: 0 },
        { ...DEFAULT_SIGNAL_DATA, id: 1 },
        { ...DEFAULT_SIGNAL_DATA, id: 2 },
        { ...DEFAULT_SIGNAL_DATA, id: 3 },
    ]
};
