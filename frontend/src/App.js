import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import HomePage from "@/pages/HomePage";
import AnalysisPage from "@/pages/AnalysisPage";
import HistoryPage from "@/pages/HistoryPage";
import ReferencePage from "@/pages/ReferencePage";
import ProgressPage from "@/pages/ProgressPage";
import ComparePage from "@/pages/ComparePage";
import GameAnalysisPage from "@/pages/GameAnalysisPage";
import CurrentAnalysisPage from "@/pages/CurrentAnalysisPage";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Sidebar>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/current-analysis" element={<CurrentAnalysisPage />} />
            <Route path="/analysis/:id" element={<AnalysisPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/reference" element={<ReferencePage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/game-analysis" element={<GameAnalysisPage />} />
          </Routes>
        </Sidebar>
      </BrowserRouter>
    </div>
  );
}

export default App;