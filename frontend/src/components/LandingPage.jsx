import './LandingPage.css';

export default function LandingPage({ onGoToLogin }) {
  const features = [
    {
      icon: '✍️',
      title: 'AI-Powered Writing',
      description: 'Let AI assist you in crafting compelling stories, articles, and more with intelligent suggestions.',
    },
    {
      icon: '📚',
      title: 'Project Management',
      description: 'Organize your work into projects and chapters for seamless writing workflow.',
    },
    {
      icon: '🔍',
      title: 'Live Review',
      description: 'Get real-time feedback on your writing with AI-powered review suggestions.',
    },
    {
      icon: '⚡',
      title: 'Smart Continuation',
      description: 'Stuck on your next sentence? Let AI continue your story naturally.',
    },
  ];

  return (
    <div className="landing-container">
      {/* Hero Section */}
      <header className="landing-header">
        <nav className="landing-nav">
          <div className="landing-logo">DiksiAI</div>
          <button className="landing-login-btn" onClick={onGoToLogin}>
            Login
          </button>
        </nav>

        <div className="hero-content">
          <h1 className="hero-title">
            Write Better with
            <span className="hero-highlight"> AI Assistance</span>
          </h1>
          <p className="hero-subtitle">
            DiksiAI is your intelligent writing companion. Create stories, organize chapters,
            and let AI help you craft your best work yet.
          </p>
          <button className="hero-cta" onClick={onGoToLogin}>
            Get Started
          </button>
        </div>

        <div className="hero-decoration">
          <div className="decoration-circle circle-1"></div>
          <div className="decoration-circle circle-2"></div>
          <div className="decoration-circle circle-3"></div>
        </div>
      </header>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="features-title">Why Choose DiksiAI?</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div className="feature-card" key={index}>
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Transform Your Writing?</h2>
          <p>Join DiksiAI today and experience the future of creative writing.</p>
          <button className="cta-button" onClick={onGoToLogin}>
            Start Writing Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>&copy; 2026 DiksiAI. All rights reserved.</p>
      </footer>
    </div>
  );
}
