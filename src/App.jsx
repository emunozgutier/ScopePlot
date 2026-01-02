import './App.css';

// Components
import MenuBar from './module/MenuBar';
import Display from './module/Display';
import ControlPanel from './module/ControlPanel';
import LoadTestMenu from './module/submodule1/LoadTestMenu';
import LoadCsvData from './module/submodule1/LoadCsvData';

function App() {
  return (
    <div className="app-container">
      <MenuBar />
      <div className="main-workspace">
        <Display />
        <ControlPanel />
      </div>
      <LoadTestMenu />
      <LoadCsvData />
    </div>
  );
}

export default App;

