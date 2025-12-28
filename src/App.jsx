import { useState, useEffect, useRef } from 'react';
import './App.css';

// ... imports
// Components
import MenuBar from './components/MenuBar';
import Display from './components/Display';
import ControlPanel from './components/ControlPanel';
import LoadTestModal from './components/subcomponents/LoadTestModal';
import { defaultSignal, generateBuffer } from './components/subcomponents/DisplaySignal';
import { getSampledData } from './components/subcomponents/subcomponents/ControlPanelTimeSamples';



// Data
import { initialMenuBarData } from './components/MenuBarData';
import { initialDisplayData } from './components/DisplayData';
import { initialControlPanelData } from './components/ControlPanelData';
import { initialFunctionGenSignalData } from './components/FunctionGenSignalData';

const initialAppData = {
  menuBarData: initialMenuBarData,
  FunctionGenSignalData: initialFunctionGenSignalData,
  displayData: initialDisplayData,
  controlPanelData: initialControlPanelData
};

function App() {
  const [appData, setAppData] = useState(initialAppData);
  const timeRef = useRef(0);

  // Initialize Channel 1 with default signal on load
  useEffect(() => {
    const { timePerUnit, TotalSignalSamples } = initialAppData.controlPanelData;
    const defaultBuffer = defaultSignal(timePerUnit, TotalSignalSamples);

    setAppData(prev => {
      const newSignals = prev.displayData.signalData.map(sig => {
        // [REF_CHANGE] sig is now instance of DisplaySignalData (or structured that way)
        // We must update sig.timeData
        const newTimeData = defaultBuffer;
        // To maintain class instance if possible, or just struct
        // React state usually breaks class methods if we spread, but we only have data fields.
        return {
          ...sig,
          defaultZeroData: false,
          timeData: newTimeData,
          timeDataSample: getSampledData(newTimeData, 'time', initialAppData.controlPanelData)
        };
      });
      return {
        ...prev,
        displayData: {
          ...prev.displayData,
          signalData: newSignals
        }
      };
    });
  }, []);

  // Handler for Frequency Domain button (Toggles Domain)
  const handleFreqDomain = () => {
    setAppData(prev => {
      const isTimeDomain = prev.controlPanelData.timeDomain;
      const newTimeDomain = !isTimeDomain;

      return {
        ...prev,
        controlPanelData: {
          ...prev.controlPanelData,
          timeDomain: newTimeDomain
        }
      };
    });
  };

  // Pass handler to ControlPanel
  const handleControlPanelUpdate = (newData) => {
    setAppData(prev => ({ ...prev, controlPanelData: newData }));
  };

  // State setters
  const setMenuBarData = (newData) => {
    setAppData(prev => ({ ...prev, menuBarData: newData }));
  };

  const updateControlPanelData = (newData) => {
    // Regenerate Samples if Time/Div or Offset changed
    // We could optimize by checking if relevant keys changed, but for now we do it safe.
    setAppData(prev => {
      const newSignals = prev.displayData.signalData.map(sig => {
        // Access current timeData
        const currentData = sig.timeData;
        // Generate new Sample based on NEW control panel data
        const newSample = getSampledData(currentData, 'time', newData);
        return { ...sig, timeDataSample: newSample };
      });

      return {
        ...prev,
        controlPanelData: newData,
        displayData: {
          ...prev.displayData,
          signalData: newSignals
        }
      };
    });
  };

  const handleMenuAction = (action) => {
    if (action === 'loadTest') {
      setAppData(prev => ({
        ...prev,
        FunctionGenSignalData: { ...prev.FunctionGenSignalData, isOpen: true }
      }));
    }
  };


  const handleSaveGenerator = (newData) => {
    // Save config and Generate Data
    // Use functional update to ensure we work with the latest state and avoid stale closures
    setAppData(prev => {
      let newAppData = { ...prev };

      // Update FunctionGenSignalData (and close modal)
      newAppData.FunctionGenSignalData = { ...newData, isOpen: false };

      if (newData.enabled) {
        // Generate Buffer
        const buffer = generateBuffer(newData);
        const targetCh = newData.targetChannelId;

        // Update Signal Data - Ensure we create a new displayData object (Immutability)
        const newSignalData = prev.displayData.signalData.map(sig => {
          if (sig.id === targetCh) {
            const newTimeData = buffer;
            return {
              ...sig,
              defaultZeroData: false,
              timeData: newTimeData,
              timeDataSample: getSampledData(newTimeData, 'time', prev.controlPanelData)
            };
          }
          return sig;
        });

        newAppData.displayData = {
          ...prev.displayData,
          signalData: newSignalData
        };

        // Ensure Channel is visible
        const channelConfig = prev.controlPanelData.channels.find(c => c.id === targetCh);
        if (channelConfig && !channelConfig.visible) {
          const newChannels = prev.controlPanelData.channels.map(c =>
            c.id === targetCh ? { ...c, visible: true } : c
          );
          newAppData.controlPanelData = {
            ...prev.controlPanelData,
            channels: newChannels
          };
        }
      }

      return newAppData;
    });
  };

  // Simulation Loop
  useEffect(() => {
    let animationFrameId;

    const renderLoop = () => {
      const { timePerUnit, TotalSignalSamples, timeDomain } = appData.controlPanelData;

      // Only simulate if not in Freq Domain? Or keep simulating in background?
      // Usually better to pause sim if viewing specific freq snapshot, but let's keep running for now
      // unless user wants it paused.

      timeRef.current += 0.02;

      setAppData(prev => {
        let hasChanges = false;

        const newSignals = prev.displayData.signalData.map(sig => {
          // Access timeData
          const tData = sig.timeData;
          // Check static data at signal root
          if (sig.defaultZeroData === false && tData && tData.length > 0) {
            return sig; // Don't re-simulate static data
          }

          // Normal Simulation Logic (Fallback)
          hasChanges = true; // We are generating new data
          const points = [];
          const chSettings = prev.controlPanelData.channels.find(c => c.id === sig.id);
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
          const newTSample = getSampledData(newT, 'time', appData.controlPanelData);
          return { ...sig, timeData: newT, timeDataSample: newTSample };
        });

        if (!hasChanges) return prev;

        return {
          ...prev,
          displayData: {
            ...prev.displayData,
            signalData: newSignals
          }
        };
      });

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [appData.controlPanelData.TotalSignalSamples, appData.controlPanelData.timePerUnit, appData.controlPanelData.timeDomain]); // added timeDomain dependency


  // Handler for individual signal updates from DisplaySignal
  const updateSignalData = (signalId, newData) => {
    setAppData(prev => {
      const newSignals = prev.displayData.signalData.map(sig => {
        if (sig.id === signalId) {
          // Determine if we are updating a specific property or replacing
          // Assuming shallow merge for properties
          return { ...sig, ...newData };
        }
        return sig;
      });

      return {
        ...prev,
        displayData: {
          ...prev.displayData,
          signalData: newSignals
        }
      };
    });
  };

  return (
    <div className="app-container">
      <MenuBar
        menuBarData={appData.menuBarData}
        setMenuBarData={setMenuBarData}
        onMenuAction={handleMenuAction}
      />
      <div className="main-workspace">
        <Display
          displayData={appData.displayData}
          controlPanelData={appData.controlPanelData}
          onUpdate={updateControlPanelData}
          onSignalUpdate={updateSignalData}
        />
        <ControlPanel
          controlPanelData={appData.controlPanelData}
          signalData={appData.displayData.signalData} // Pass updated signalData structure
          onUpdate={updateControlPanelData}
          onFreqDomain={handleFreqDomain}
        />
      </div>
      <LoadTestModal
        data={appData.FunctionGenSignalData}
        onSave={handleSaveGenerator}
        onClose={() => setAppData(prev => ({ ...prev, FunctionGenSignalData: { ...prev.FunctionGenSignalData, isOpen: false } }))}
      />
    </div>
  );
}

export default App;
