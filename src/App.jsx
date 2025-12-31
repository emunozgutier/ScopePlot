import './App.css';

// Components
import MenuBar from './module/MenuBar';
import Display from './module/Display';
import ControlPanel from './module/ControlPanel';
import LoadTestMenu from './module/submodule1/LoadTestMenu';

function App() {
  return (
    <div className="app-container">
      <MenuBar />
      <div className="main-workspace">
        <Display />
        <ControlPanel />
      </div>
      <LoadTestMenu />
    </div>
  );
}

export default App;

