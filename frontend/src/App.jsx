import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MyBeginingRoom from './pages/MyBeginingRoom';
import MyGameRoom from './pages/MyGameRoom';
import MyLeadingGameRoom from './pages/MyLeadingGameRoom';
import MyDuelRoom from './pages/MyDuelRoom';
import MyLeadingDuelRoom from './pages/MyLeadingDuelRoom';
import MyLeadingLobby from './pages/MyLeadingLobby';
import MyLobby from './pages/MyLobby';
import EndGameRoom from './pages/EndGameRoom';
import './styles/App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/my-begin" replace />} />
          <Route path="/my-begin" element={<MyBeginingRoom />} />
          <Route path="/game" element={<MyGameRoom />} />
          <Route path="/leading-game" element={<MyLeadingGameRoom />} />
          <Route path="/duel" element={<MyDuelRoom />} />
          <Route path="/leading-duel" element={<MyLeadingDuelRoom />} />
          <Route path="/end-game" element={<EndGameRoom />} />
          <Route path="/leading-lobby" element={<MyLeadingLobby />} />
          <Route path="/lobby" element={<MyLobby />} />
          <Route path="*" element={<Navigate to="/my-begin" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
