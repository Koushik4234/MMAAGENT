import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AmbientBackground from './AmbientBackground.jsx';
import ThemeToggle from './ThemeToggle.jsx';

export default function Layout() {
  const { isAuthed, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="shell">
      {/* Floating background: full effect on the Talk page, quieter elsewhere */}
      <AmbientBackground variant={pathname === '/' ? 'rich' : 'subtle'} />

      <header className="topbar">
        <strong className="brand">
          <span className="brand-mark">🎙</span>
          <span className="grad-text">Voice Agent</span>
        </strong>
        <nav>
          <NavLink to="/" end>
            Talk
          </NavLink>
          <NavLink to="/dashboard">Dashboard</NavLink>
        </nav>
        <ThemeToggle />
        {isAuthed && (
          <button
            className="btn btn-ghost"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Log out
          </button>
        )}
      </header>

      {/* key={pathname} replays the fade-up animation on every page change */}
      <main className="content page-enter" key={pathname}>
        <Outlet />
      </main>
    </div>
  );
}