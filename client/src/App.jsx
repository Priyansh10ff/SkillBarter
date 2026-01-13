import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext"; 
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Register from "./components/Register";
import CreateListing from "./components/CreateListing";
import Home from "./components/Home";
import Transactions from "./components/Transactions";
import VideoRoom from "./components/VideoRoom";
import Profile from "./components/Profile";
import Leaderboard from "./components/Leaderboard";
import VerifyEmail from "./components/VerifyEmail";
import axios from "axios"; // 1. Import Axios

// 2. Set the Global Base URL for API calls
// This tells axios to use your Render URL in production, but localhost on your PC
// axios.defaults.baseURL = import.meta.env.VITE_API_URL || "https://skillbarter-yew1.onrender.com";
axios.defaults.withCredentials = true; // Important if you use cookies/sessions

const App = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="min-h-screen bg-[#020617]">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email/:token" element={<VerifyEmail />} />
              <Route path="/create-listing" element={<CreateListing />} />
              <Route path="/my-transactions" element={<Transactions />} />
              <Route path="/room/:id" element={<VideoRoom />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
            </Routes>
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;