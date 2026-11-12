-- All tables for Community Garden Plots.
-- Run once in the Neon Console > SQL Editor, then run seed.sql.
-- The CHECK rules repeat the API's validation inside the database (Lab 5).

-- Users (Moaaz)
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(80)  NOT NULL,
  email         VARCHAR(120) NOT NULL UNIQUE,
  password_hash TEXT         NOT NULL,
  role          TEXT         NOT NULL DEFAULT 'resident' CHECK (role IN ('resident', 'admin')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Plots & Applications (Moaaz)
CREATE TABLE plots (
  id       SERIAL PRIMARY KEY,
  label    VARCHAR(20)  NOT NULL UNIQUE,
  size     VARCHAR(30)  NOT NULL,
  location VARCHAR(100) NOT NULL,
  status   TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'maintenance'))
);

CREATE TABLE applications (
  id               SERIAL PRIMARY KEY,
  user_id          INTEGER NOT NULL REFERENCES users(id),
  season           VARCHAR(40)  NOT NULL,
  note             VARCHAR(300) NOT NULL DEFAULT '',
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
  assigned_plot_id INTEGER REFERENCES plots(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Shared Tools (Mayan)
CREATE TABLE tools (
  id        SERIAL PRIMARY KEY,
  name      VARCHAR(80) NOT NULL,
  category  VARCHAR(40) NOT NULL,
  condition TEXT NOT NULL DEFAULT 'good' CHECK (condition IN ('good', 'fair', 'damaged'))
);

CREATE TABLE loans (
  id               SERIAL PRIMARY KEY,
  tool_id          INTEGER NOT NULL REFERENCES tools(id),
  user_id          INTEGER NOT NULL REFERENCES users(id),
  checkout_date    TIMESTAMPTZ NOT NULL DEFAULT now(),
  return_date      TIMESTAMPTZ,
  status           TEXT NOT NULL DEFAULT 'on_loan' CHECK (status IN ('on_loan', 'returned')),
  return_condition TEXT CHECK (return_condition IN ('good', 'fair', 'damaged'))
);

-- Watering Duties (Mahmoud)
CREATE TABLE duties (
  id               SERIAL PRIMARY KEY,
  plot_id          INTEGER NOT NULL REFERENCES plots(id),
  assigned_user_id INTEGER NOT NULL REFERENCES users(id),
  duty_date        DATE NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  completed_at     TIMESTAMPTZ
);

-- Audit log (Mahmoud)
CREATE TABLE audit_logs (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id),
  action     VARCHAR(40)  NOT NULL,
  details    VARCHAR(300) NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
