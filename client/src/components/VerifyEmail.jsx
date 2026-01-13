import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [message, setMessage] = useState("");
  // Simple ref to prevent double execution
  const [executed, setExecuted] = useState(false);

  useEffect(() => {
    if (executed) return;
    
    const verifyEmail = async () => {
      setExecuted(true); // Mark as running/run
      try {
        // Determine backend URL
        let API_URL = import.meta.env.VITE_API_URL;
        
        if (!API_URL) {
          if (window.location.hostname === "localhost") {
            API_URL = "http://localhost:5000";
          } else {
            // Fallback for production if env var is missing
            API_URL = "https://skillbarter-yew1.onrender.com";
          }
        }
        
        console.log("Verifying with backend:", API_URL); // Debug log

        const response = await axios.get(`${API_URL}/api/users/verify-email/${token}`);
        
        setStatus("success");
        setMessage(response.data.message);

        // Store the token if provided
        if (response.data.token) {
          localStorage.setItem("token", response.data.token);
        }

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } catch (error) {
        console.error("Verification Error:", error);
        setStatus("error");
        
        // Detailed error message for debugging
        const errorMsg = error.response?.data?.message || "Verification failed";
        const debugMsg = error.response?.status 
          ? `${errorMsg} (Status: ${error.response.status})` 
          : error.message;
          
        setMessage(debugMsg);
      }
    };

    if (token) {
      verifyEmail();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="bg-slate-800 p-8 rounded-lg shadow-2xl max-w-md w-full text-center">
        {status === "verifying" && (
          <div>
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-white mb-2">Verifying Email...</h2>
            <p className="text-gray-400">Please wait while we verify your email address.</p>
          </div>
        )}

        {status === "success" && (
          <div>
            <div className="mb-4">
              <svg
                className="w-16 h-16 text-green-500 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Email Verified!</h2>
            <p className="text-gray-300 mb-4">{message}</p>
            <p className="text-gray-400 text-sm">Redirecting to login page...</p>
          </div>
        )}

        {status === "error" && (
          <div>
            <div className="mb-4">
              <svg
                className="w-16 h-16 text-red-500 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
            <p className="text-gray-300 mb-6">{message}</p>
            <button
              onClick={() => navigate("/register")}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition duration-200"
            >
              Back to Register
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
