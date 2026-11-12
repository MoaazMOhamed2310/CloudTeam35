-- Starting data: the garden's plots and tools. Run once after schema.sql.
-- No users here, so no password is in the repository:
-- residents register on the website, admins are made with  npm run create-admin

INSERT INTO plots (label, size, location, status) VALUES
  ('A-01', '3 × 2 m', 'North bed, near the gate', 'available'),
  ('A-02', '3 × 4 m', 'North bed, near the gate', 'available'),
  ('A-03', '2 × 2 m', 'North bed, near the gate', 'available'),
  ('A-04', '3 × 2 m', 'North bed, near the gate', 'available'),
  ('B-10', '3 × 4 m', 'East bed, full sun',       'available'),
  ('B-11', '2 × 2 m', 'East bed, full sun',       'available'),
  ('B-12', '3 × 2 m', 'East bed, full sun',       'available'),
  ('B-13', '3 × 4 m', 'East bed, full sun',       'available'),
  ('C-20', '2 × 2 m', 'South bed, partial shade', 'available'),
  ('C-21', '3 × 2 m', 'South bed, partial shade', 'available'),
  ('C-22', '3 × 4 m', 'South bed, partial shade', 'maintenance'),
  ('D-30', '2 × 2 m', 'Shed corner',              'available');

INSERT INTO tools (name, category, condition) VALUES
  ('Garden fork',         'Digging',    'good'),
  ('Spade',               'Digging',    'good'),
  ('Garden rake',         'Hand tools', 'good'),
  ('Wheelbarrow',         'Transport',  'fair'),
  ('Pruning shears',      'Cutting',    'good'),
  ('Watering can (10 L)', 'Watering',   'good'),
  ('Hose reel (25 m)',    'Watering',   'fair'),
  ('Hand trowel',         'Hand tools', 'good');
