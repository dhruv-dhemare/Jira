export default function Hero() {
  return (
    <section className="hero">
      <h1>Manage Your Team's Work, Smarter</h1>

      <p>
        A modern project management tool built for robotics teams,
        startups, and fast-moving builders.
      </p>

      <button
        className="cta-btn"
        onClick={() =>
          (window.location.href = "http://localhost:5000/auth/google")
        }
      >
        Get Started
      </button>
    </section>
  );
}