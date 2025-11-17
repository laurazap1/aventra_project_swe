import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Itinerary from "./pages/Itinerary";
import Reviews from "./pages/Reviews";
import Login from "./pages/Login";      
import Register from "./pages/Register"; 
import Navbar from "./components/Navbar";
import Profile from "./pages/Profile";
import Tokyo from "./pages/Tokyo";
import Paris from "./pages/Paris";
import NYC from "./pages/NYC";
import Santorini from "./pages/Santorini";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/itinerary" element={<Itinerary />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/login" element={<Login />} />          
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />     
        <Route path="/tokyo" element={<Tokyo />} />
        <Route path="/paris" element={<Paris />} />
        <Route path="/nyc" element={<NYC />} />
        <Route path="/santorini" element={<Santorini />} />
      </Routes>
    </Router>
  );
}

export default App;
