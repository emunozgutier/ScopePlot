export const DEFAULT_SIGNAL_DATA = {
    id: 0,
    defaultZeroData: true,
    voltageTimeData: [], // Array of [time, voltage]
    OriginalVoltageTimeData: [] // Loaded/Generated static data
};

export class DisplaySignalData {
    constructor(id) {
        this.id = id;
        // Deep copy default signal data to avoid shared references
        this.timeData = JSON.parse(JSON.stringify(DEFAULT_SIGNAL_DATA));
        this.timeData.id = id; // Ensure ID matches
        this.frequencyData = null;
    }
}
