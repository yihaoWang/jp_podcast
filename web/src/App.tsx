import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Player from "./pages/Player";
import Review from "./pages/Review";
import Upload from "./pages/Upload";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/scenario/:id" element={<Player />} />
        <Route path="/review" element={<Review />} />
        <Route path="/upload" element={<Upload />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
