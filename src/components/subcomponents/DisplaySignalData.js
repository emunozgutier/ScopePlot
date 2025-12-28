export const DEFAULT_SIGNAL_DATA = [];

export class DisplaySignalData {
    constructor(id) {
        this.id = id;

        this.timeData = []; // Array of [time, voltage]
        this.frequencyData = null;
        this.timeDataSample = [];
        this.frequencyDataSample = [];
    }
}
