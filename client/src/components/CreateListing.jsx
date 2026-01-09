import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { PenTool } from "lucide-react";

const CreateListing = () => {
  const [form, setForm] = useState({ title: "", description: "", category: "Coding", duration: 60 });
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    await axios.post("http://localhost:5000/api/listings", form, { headers: { Authorization: `Bearer ${token}` } });
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-xl p-10 rounded-3xl shadow-xl border border-slate-100">
        <div className="flex items-center gap-3 mb-8">
           <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600"><PenTool /></div>
           <h1 className="text-2xl font-bold">Post a Skill</h1>
        </div>

        <form onSubmit={submit} className="space-y-5">
           <input type="text" placeholder="Title (e.g. Advanced JS)" className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition"
             onChange={e => setForm({...form, title: e.target.value})} required />
           
           <textarea placeholder="Description" className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition min-h-[100px]"
             onChange={e => setForm({...form, description: e.target.value})} required />

           <div className="grid grid-cols-2 gap-4">
              <select className="p-4 bg-slate-50 rounded-xl outline-none" onChange={e => setForm({...form, category: e.target.value})}>
                 {["Coding", "Music", "Design", "Language"].map(c => <option key={c}>{c}</option>)}
              </select>
              <input type="number" value={form.duration} className="p-4 bg-slate-50 rounded-xl outline-none"
                 onChange={e => setForm({...form, duration: e.target.value})} />
           </div>

           <button className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-500 transition">Publish</button>
        </form>
      </div>
    </div>
  );
};
export default CreateListing;