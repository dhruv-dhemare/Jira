import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Footer from "../components/Footer";
import "../styles/landing.css";

export default function Landing() {
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