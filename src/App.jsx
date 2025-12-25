import { useState, useEffect, useRef } from 'react';
import './App.css';

// Components
import MenuBar from './components/MenuBar';
import Display from './components/Display';
import ControlPanel from './components/ControlPanel';
import LoadTestModal from './components/LoadTestModal';

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

  // Helper to generate signal buffer
  const generateSignalBuffer = (config) => {
    const { duration, sampleRate, frequency, shape, amplitude } = config;
    const count = Math.floor(duration * sampleRate);
    const points = [];

    for (let i = 0; i < count; i++) {
      const t = i / sampleRate;
      const phase = 0; // Static start
      const omega = 2 * Math.PI * frequency;
      let val = 0;

      if (shape === 'sine') {
        val = Math.sin(omega * t + phase);
      } else if (shape === 'square') {
        val = Math.sin(omega * t + phase) > 0 ? 1 : -1;
      } else if (shape === 'triangle') {
        // Triangle wave approximation
        val = (2 / Math.PI) * Math.asin(Math.sin(omega * t + phase));
      }

      points.push([t, val * amplitude]);
    }
    return points;
  };

  const handleSaveGenerator = (newData) => {
    // Save config and Generate Data
    const newAppData = { ...appData };
    newAppData.FunctionGenSignalData = { ...newData, isOpen: false }; // Close modal

    if (newData.enabled) {
      // Generate Buffer
      const buffer = generateSignalBuffer(newData);
      const targetCh = newData.targetChannelId;

      // Update Signal Data with Original
      newAppData.displayData.signalData = newAppData.displayData.signalData.map(sig => {
        if (sig.id === targetCh) {
          return {
            ...sig,
            defaultZeroData: false, // [FIX] User requirement
            OriginalVoltageTimeData: buffer,
            voltageTimeData: buffer // Display immediately
          };
        }
        return sig;
      });

      // Ensure Channel is visible
      const channelConfig = newAppData.controlPanelData.channels.find(c => c.id === targetCh);
      if (!channelConfig.visible) {
        newAppData.controlPanelData.channels = newAppData.controlPanelData.channels.map(c =>
          c.id === targetCh ? { ...c, visible: true } : c
        );
      }
    }

    setAppData(newAppData);
  };

  // Simulation Loop
  useEffect(() => {
    let animationFrameId;

    const renderLoop = () => {
      const { timePerUnit, samplesPerSecond } = appData.controlPanelData;

      timeRef.current += 0.02;

      setAppData(prev => {
        const newSignals = prev.displayData.signalData.map(sig => {
          if (sig.OriginalVoltageTimeData && sig.OriginalVoltageTimeData.length > 0) {
            return sig; // Don't re-simulate
          }

          // Normal Simulation Logic (Fallback)
          const points = [];
          const chSettings = prev.controlPanelData.channels.find(c => c.id === sig.id);
          if (!chSettings || !chSettings.visible) {
            return { ...sig, voltageTimeData: [] };
          }

          const count = Math.min(2000, Math.floor(10 * timePerUnit * samplesPerSecond));

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
          return { ...sig, voltageTimeData: points };
        });

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
  }, [appData.controlPanelData.samplesPerSecond, appData.controlPanelData.timePerUnit]);

  // State setters
  const setMenuBarData = (newData) => {
    setAppData(prev => ({ ...prev, menuBarData: newData }));
  };

  const updateControlPanelData = (newData) => {
    setAppData(prev => ({ ...prev, controlPanelData: newData }));
  };

  const handleMenuAction = (action) => {
    if (action === 'loadTest') {
      setAppData(prev => ({
        ...prev,
        FunctionGenSignalData: { ...prev.FunctionGenSignalData, isOpen: true }
      }));
    }
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
        />
        <ControlPanel
          controlPanelData={appData.controlPanelData}
          onUpdate={updateControlPanelData}
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
