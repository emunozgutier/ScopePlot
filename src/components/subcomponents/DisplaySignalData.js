import { DEFAULT_SIGNAL_DATA } from '../DisplayData';

export class DisplaySignalData {
    constructor(id) {
        this.id = id;
        // Deep copy default signal data to avoid shared references
        this.timeData = JSON.parse(JSON.stringify(DEFAULT_SIGNAL_DATA));
        this.timeData.id = id; // Ensure ID matches
        this.frequencyData = null;
    }
}
