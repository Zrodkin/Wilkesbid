-- Seed Data for Auction Site
-- Default holiday templates

INSERT INTO holiday_templates (name, services) VALUES
('Yom Kippur', ARRAY['Kol Nidrei', 'Shacharit', 'Yizkor', 'Mincha', 'Neilah']),
('Rosh Hashanah', ARRAY['Erev Rosh Hashanah', 'Day 1 Shacharit', 'Day 1 Mincha', 'Day 2 Shacharit', 'Day 2 Mincha']),
('Shabbos', ARRAY['Friday Night', 'Shabbos Morning', 'Shabbos Afternoon'])
ON CONFLICT (name) DO NOTHING;