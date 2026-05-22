import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Player from "./pages/Player";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/scenario/:id" element={<Player />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
