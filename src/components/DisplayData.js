import { DisplaySignalData } from './subcomponents/DisplaySignalData';

export const DEFAULT_SIGNAL_DATA = {
    id: 0,
    defaultZeroData: true,
    voltageTimeData: [], // Array of [time, voltage]
    OriginalVoltageTimeData: [] // Loaded/Generated static data
};

export const initialDisplayData = {
    signalData: [
        new DisplaySignalData(0),
        new DisplaySignalData(1),
        new DisplaySignalData(2),
        new DisplaySignalData(3),
    ]
};
