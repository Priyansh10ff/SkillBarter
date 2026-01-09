import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext"; // Import this
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Register from "./components/Register";
import CreateListing from "./components/CreateListing";
import Home from "./components/Home";
import Transactions from "./components/Transactions";
import VideoRoom from "./components/VideoRoom";
import Profile from "./components/Profile";


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
              <Route path="/create-listing" element={<CreateListing />} />
              <Route path="/my-transactions" element={<Transactions />} />
              <Route path="/room/:id" element={<VideoRoom />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;