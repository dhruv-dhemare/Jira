import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Footer from "../components/Footer";
import "../styles/landing.css";
import { Navigate , useLocation } from "react-router-dom";

export default function Landing() {
  const token = localStorage.getItem("token");

  if (token && location.pathname === "/") {
    return <Navigate to="/spaces" replace />;
  }

  return (
    <div>
      <Navbar />
      <div className="page">
        <Hero />
        <Features />
        <Footer />
      </div>
    </div>
  );
}