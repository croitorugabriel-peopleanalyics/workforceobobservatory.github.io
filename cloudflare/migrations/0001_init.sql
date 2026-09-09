PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  password_iterations INTEGER NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  topic_id INTEGER NOT NULL,
  author_user_id INTEGER,
  status TEXT NOT NULL CHECK (status IN ('draft', 'scheduled', 'published')),
  publish_at TEXT,
  reading_minutes INTEGER NOT NULL DEFAULT 10,
  social_image_url TEXT,
  carousel_source TEXT,
  carousel_hook TEXT,
  executive_takeaway TEXT,
  keywords_json TEXT NOT NULL DEFAULT '[]',
  related_slugs_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE RESTRICT,
  FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS article_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER NOT NULL,
  sort_order INTEGER NOT NULL,
  section_key TEXT NOT NULL,
  section_type TEXT NOT NULL,
  title TEXT NOT NULL,
  eyebrow TEXT,
  body TEXT NOT NULL DEFAULT '',
  animation_preset TEXT NOT NULL DEFAULT 'fade-up',
  layout_variant TEXT NOT NULL DEFAULT 'standard',
  media_json TEXT NOT NULL DEFAULT '[]',
  settings_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  UNIQUE (article_id, section_key)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

INSERT OR IGNORE INTO topics (slug, name, summary, created_at, updated_at) VALUES
  ('hr-datamart', 'HR DataMart', 'Decision-first architecture, governed modelling and reusable foundations for trusted workforce reporting.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('people-analytics', 'People Analytics', 'Decision-ready metrics, semantic consistency and executive storytelling for workforce insight products.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('workforce-health-score', 'Workforce Health Score', 'Composite workforce indicators, normalization strategies and risk guardrails for executive use.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('workforce-planning', 'Workforce Planning', 'Scenario-ready workforce structures and planning logic for future capacity, capability and cost choices.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('talent-intelligence', 'Talent Intelligence', 'Signals, architectures and interpretation patterns for hiring, mobility, skills and talent risk.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('responsible-ai', 'Responsible AI', 'Governed AI foundations, explainability patterns and trust controls for HR and People Analytics.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('hr-data-governance', 'HR Data Governance', 'Controls, stewardship and secure operating models for trustworthy workforce data products.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('organizational-health', 'Organizational Health', 'Measures and narratives that help leaders understand workforce resilience, alignment and effectiveness.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('analytics-engineering', 'Analytics Engineering', 'Reliable ingestion, modelling, testing and operating patterns for modern workforce data platforms.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('microsoft-fabric-for-hr', 'Microsoft Fabric for HR', 'Future implementation patterns for Microsoft Fabric-based workforce intelligence foundations.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
