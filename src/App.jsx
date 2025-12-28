import { useEffect, useRef } from 'react';
import './App.css';

// Components
import MenuBar from './components/MenuBar';
import Display from './components/Display';
import ControlPanel from './components/ControlPanel';
import LoadTestModal from './components/subcomponents/LoadTestModal';
import { defaultSignal } from './components/subcomponents/DisplaySignal';
import { getSampledData } from './components/subcomponents/subcomponents/ControlPanelTimeSamples';

// Stores
import { useMenuBarStore } from './stores/useMenuBarStore';
import { useControlPanelStore } from './stores/useControlPanelStore';
import { useSignalStore } from './stores/useSignalStore';
import { useFunctionGenStore } from './stores/useFunctionGenStore';

// Data (Still needed for initial constants if referenced, or handled by stores internally)
import { initialControlPanelData } from './components/ControlPanelData'; // Backup access if needed

function App() {
  // We don't need local state for data anymore.
  // We use refs for simulation time to avoid re-renders just for time increment (though loop causes updates anyway)
  const timeRef = useRef(0);

  // Access stores for simulation loop (using getState() to avoid subscriptions in non-rendering scope, 
  // but here we are in a component so we can subscribe or use getState inside effect)
  // We don't need to subscribe to the *whole* state here for rendering, just for the loop.

  // Initialize Channel 1 with default signal on load
  useEffect(() => {
    // Access stores directly via getState to set initial values without waiting for render cycle
    const { timePerUnit, TotalSignalSamples } = useControlPanelStore.getState().controlPanelData;
    const defaultBuffer = defaultSignal(timePerUnit, TotalSignalSamples);

    const currentSignals = useSignalStore.getState().displayData.signalData;

    const newSignals = currentSignals.map(sig => {
      // Initialize timeData
      const newTimeData = defaultBuffer;
      return {
        ...sig,
        defaultZeroData: false,
        timeData: newTimeData,
        timeDataSample: getSampledData(newTimeData, 'time', useControlPanelStore.getState().controlPanelData)
      };
    });

    useSignalStore.getState().setSignalData(newSignals);
  }, []);

  // Simulation Loop
  useEffect(() => {
    let animationFrameId;

    const renderLoop = () => {
      const controlPanelData = useControlPanelStore.getState().controlPanelData;
      const { timePerUnit, TotalSignalSamples } = controlPanelData;

      // If paused or freq domain only? Logic from original App used timeDomain check somewhat?
      // Original: const { timePerUnit, TotalSignalSamples, timeDomain } = appData.controlPanelData;

      timeRef.current += 0.02;

      // Logic from original App
      const prevSignals = useSignalStore.getState().displayData.signalData;

      let hasChanges = false;
      const newSignals = prevSignals.map(sig => {
        // Access timeData
        const tData = sig.timeData;
        // Check static data
        if (sig.defaultZeroData === false && tData && tData.length > 0) {
          return sig; // Don't re-simulate
        }

        // Simulation
        hasChanges = true;
        const points = [];
        const chSettings = controlPanelData.channels.find(c => c.id === sig.id);

        if (!chSettings || !chSettings.visible) {
          return { ...sig, timeData: [] };
        }

        const count = Math.min(5000, TotalSignalSamples);

        for (let i = 0; i < count; i++) {
          const relativeT = (i / count) * (10 * timePerUnit);
          let val = 0;
          const phase = timeRef.current * 5;
          const freq = 1 + sig.id;

          if (sig.id === 0) {
            val = Math.sin(relativeT * freq + phase);
          } else if (sig.id === 1) {
            val = Math.sin(relativeT * freq + phase) > 0 ? 1 : -1;
          } else if (sig.id === 2) {
            val = Math.asin(Math.sin(relativeT * freq + phase));
          } else {
            val = (Math.random() - 0.5);
          }
          if (chSettings.noiseFilter) val *= 0.5;
          points.push([relativeT, val * 3]);
        }

        const newT = points;
        const newTSample = getSampledData(newT, 'time', controlPanelData);
        return { ...sig, timeData: newT, timeDataSample: newTSample };
      });

      if (hasChanges) {
        useSignalStore.getState().setSignalData(newSignals);
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();
    return () => cancelAnimationFrame(animationFrameId);
  }, []); // Dependencies? Original had specific deps to restart loop. Here we just run it. 
  // Inside loop we read current state via getState() so it's fresh.

  // Note: Original had dependency on TotalSignalSamples, timePerUnit, timeDomain.
  // Because those change simulation params. 
  // Since we use getState(), we get fresh params every frame.
  // So [] is fine.

  // "Refresh" logic for control updates (previously updateControlPanelData logic):
  // In original App, updating control panel triggered regeneration of samples for static signals.
  // We lost that if we just moved state.
  // ControlPanel store has updateControlPanelData.
  // We might need to listen to that or just rely on components triggering updates.
  // Ideally, ControlPanel updates should trigger sample regeneration if needed.
  // But since this is a refactor, I might have missed the "regenerate samples on time/div change" logic
  // which was present in App.jsx's `updateControlPanelData`.

  // I should add a subscription or effect to handle sample regeneration for static signals when ControlPanel changes.
  // Let's add that effect here.

  const controlPanelData = useControlPanelStore(state => state.controlPanelData);

  useEffect(() => {
    // Regenerate samples for ALL signals when relevant control panel data changes
    // Logic from original updateControlPanelData:
    /*
        const newSignals = prev.displayData.signalData.map(sig => {
            const currentData = sig.timeData;
            const newSample = getSampledData(currentData, 'time', newData);
            return { ...sig, timeDataSample: newSample };
        });
    */

    const currentSignals = useSignalStore.getState().displayData.signalData;
    const newSignals = currentSignals.map(sig => {
      // We only need to update samples if we have data
      if (sig.timeData && sig.timeData.length > 0) {
        const newSample = getSampledData(sig.timeData, 'time', controlPanelData);
        return { ...sig, timeDataSample: newSample };
      }
      return sig;
    });

    useSignalStore.getState().setSignalData(newSignals);

  }, [controlPanelData.timePerUnit, controlPanelData.TotalSignalSamples, controlPanelData.timeOffset]); // Add others if needed

  return (
    <div className="app-container">
      <MenuBar />
      <div className="main-workspace">
        <Display />
        <ControlPanel />
      </div>
      <LoadTestModal />
    </div>
  );
}

export default App;
