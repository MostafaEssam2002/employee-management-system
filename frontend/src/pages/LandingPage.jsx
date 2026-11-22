import { useNavigate } from "react-router-dom";
import "./LandingPage.scss";

// روابط الأقسام جوه الصفحة (بنعمل scroll بدل تغيير الـ hash عشان ما نكسرش الـ router)
const NAV = [
  { label: "Features", id: "features" },
  { label: "Workflow", id: "workflow" },
  { label: "Security", id: "security" },
  { label: "API Docs", id: "api" },
];

// غيّر المسارات دي لمسارات صفحات موقعك الفعلية
const DEFAULT_ROUTES = {
  login: "/login",
  register: "/register",
  dashboard: "/landingpage",
};

const scrollToId = (id) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

const EMPLOYEES = [
  { name: "Employee A", dept: "Engineering", status: "Hired", tone: "green" },
  { name: "Employee B", dept: "Finance", status: "Interview scheduled", tone: "amber" },
  { name: "Employee C", dept: "Operations", status: "Application received", tone: "blue" },
];

const STAGES = [
  { label: "Application received", tone: "blue" },
  { label: "Interview scheduled", tone: "amber" },
  { label: "Hired", tone: "green" },
  { label: "Not accepted", tone: "red" },
];

const ENDPOINTS = [
  { method: "GET", path: "/employees", tone: "green" },
  { method: "POST", path: "/employees", tone: "blue" },
  { method: "PATCH", path: "/employees/:id/status", tone: "amber" },
];

const LogoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1V5a2 2 0 0 0-3-1z" />
    <path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1" />
  </svg>
);

export default function LandingPage({ routes = DEFAULT_ROUTES }) {
  const r = { ...DEFAULT_ROUTES, ...routes };
  const navigate=useNavigate()
  return (
    <div className="lp">
      <div className="lp__navWrap">
        <header className="lp__nav">
          <a href={r.dashboard} className="lp__brand"><LogoIcon />BrainWise</a>
          <nav className="lp__links">
            {NAV.map((n) => (
              <button key={n.id} type="button" onClick={() => scrollToId(n.id)}>{n.label}</button>
            ))}
          </nav>
          <div className="lp__navActions">
            <a href={r.login} className="lp__btn lp__btn--ghost lp__btn--sm">Log in</a>
            <a href={r.register} className="lp__btn lp__btn--lime lp__btn--sm">Get started</a>
          </div>
        </header>
      </div>

      <section id="top" className="lp__hero">
        <span className="lp__chip"><i />v1.2.0 · REST API included</span>
        <h1>Employee management, onboarding and API control. <em>One platform.</em></h1>
        <p>Run companies, departments and people securely, with a built-in hiring workflow and RESTful APIs your team can ship against.</p>
        <div className="lp__actions">
          <a href={r.register} className="lp__btn lp__btn--lime">Get started</a>
          <a href={r.login} className="lp__btn lp__btn--ghost">Log in</a>
        </div>
      </section>

      <section className="lp__mock">
        <div className="lp__window">
          <div className="lp__windowBar">
            <i /><i /><i />
            <span>brainwise / employees</span>
          </div>
          <div className="lp__table">
            <div className="lp__row lp__row--head"><span>Name</span><span>Department</span><span>Status</span></div>
            {EMPLOYEES.map((e) => (
              <div className="lp__row" key={e.name}>
                <span className="lp__name">{e.name}</span>
                <span className="lp__muted">{e.dept}</span>
                <span><b className={`lp__pill lp__pill--${e.tone}`}>{e.status}</b></span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="lp__features">
        <h2>Everything people-ops needs, nothing it doesn't.</h2>
        <p className="lp__lead">Four building blocks, designed to work together from day one.</p>

        <div className="lp__grid">
          <article className="lp__tile lp__tile--wide">
            <small>01 / RECORDS</small>
            <h3>Comprehensive records</h3>
            <p>Companies, departments and employees live in one connected model, so every profile is complete and easy to query.</p>
            <div className="lp__flow">
              <span>Companies</span><u>→</u><span>Departments</span><u>→</u>
              <span className="is-active">Employees</span>
            </div>
          </article>

          <article id="security" className="lp__tile">
            <small>02 / ACCESS</small>
            <h3>Secure by default</h3>
            <p>Role-based access control and authenticated sessions guard every record.</p>
            <div className="lp__roles">
              {["admin", "manager", "employee"].map((r) => <span key={r}>{r}</span>)}
            </div>
          </article>

          <article id="workflow" className="lp__tile">
            <small>03 / ONBOARDING</small>
            <h3>Hiring workflow</h3>
            <p>Move each candidate through clear stages, with status tracked automatically.</p>
            <ul className="lp__stages">
              {STAGES.map((s) => (
                <li key={s.label}><i className={`dot dot--${s.tone}`} />{s.label}</li>
              ))}
            </ul>
          </article>

          <article id="api" className="lp__tile lp__tile--wide">
            <small>04 / API</small>
            <h3>RESTful API access</h3>
            <p>Read and write your data from any stack with clean, predictable endpoints.</p>
            <div className="lp__code">
              {ENDPOINTS.map((e) => (
                <div key={e.method + e.path}>
                  <span className={`m m--${e.tone}`}>{e.method}</span> {e.path}
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="lp__cta">
        <div>
          <h2>Ready to run your team on BrainWise?</h2>
          <p>Create your account and start managing companies, departments and employees today.</p>
          {/* <a href={navigate("/register")} className="lp__btn lp__btn--dark">Create an account</a> */}
          <button onClick={()=>navigate("/register")} className="lp__btn lp__btn--dark">Create an account</button>

        </div>
      </section>

      <footer className="lp__footer">
        <div>
          <strong>BrainWise</strong>
          <button onClick={()=>navigate("/login")}>Log in</button>
          <button onClick={()=>navigate("/register")}>Register</button>
          <button onClick={()=>navigate("/")}>Dashboard</button>
          <button type="button" onClick={() => scrollToId("api")}>API Docs</button>
        </div>
        <span>© 2026 BrainWise Inc. · v1.2.0</span>
      </footer>
    </div>
  );
}