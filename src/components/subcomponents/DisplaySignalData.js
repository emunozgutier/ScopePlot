export const DEFAULT_SIGNAL_DATA = [];

export class DisplaySignalData {
    constructor(id) {
        this.id = id;
        this.defaultZeroData = true;
        this.timeData = []; // Array of [time, voltage]
        this.OriginalVoltageTimeData = []; // Loaded/Generated static data
        this.frequencyData = null;
    }
}
