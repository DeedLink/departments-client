import { Routes, Route, Link } from "react-router-dom";

function Home() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
    </div>
  );
}

function About() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-800 text-white">
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
    </Routes>
  );
}
