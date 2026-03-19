export default function Navbar() {
  const handleLogin = () => {
    window.location.href = "http://localhost:5000/auth/google";
  };

  return (
    <nav className="navbar">
      <div className="logo">RoboManage</div>

      <button className="login-btn" onClick={handleLogin}>
        Login with Google
      </button>
    </nav>
  );
}