import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Itinerary from "./pages/Itinerary";
import Reviews from "./pages/Reviews";
import PostDetail from "./pages/PostDetail";
import SharedItinerary from "./pages/SharedItinerary";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Navbar from "./components/Navbar";
import Profile from "./pages/Profile";
import Tokyo from "./pages/Tokyo";
import Paris from "./pages/Paris";
import NYC from "./pages/NYC";
import Santorini from "./pages/Santorini";
import ThingsToDo from "./pages/ThingsToDo";

function App() {
  return (
    <Router>
      <Navbar />
      <div className="pt-20 md:pt-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/itinerary" element={<Itinerary />} />
          <Route path="/things-to-do" element={<ThingsToDo />} />
          <Route path="/shared-itinerary" element={<SharedItinerary />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/reviews/:id" element={<PostDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/tokyo" element={<Tokyo />} />
          <Route path="/paris" element={<Paris />} />
          <Route path="/nyc" element={<NYC />} />
          <Route path="/santorini" element={<Santorini />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
