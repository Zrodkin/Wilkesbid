-- Supabase Schema Export for Auction Site
-- Generated: 2025-10-10

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLES
-- ============================================================================

-- Auction Configuration
CREATE TABLE auction_config (
  id int4 NOT NULL DEFAULT nextval('auction_config_id_seq'::regclass) PRIMARY KEY,
  end_time timestamptz NOT NULL,
  start_time timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active'::text,
  holiday_name text,
  services _text DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Bidders
CREATE TABLE bidders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bidders_email_key UNIQUE (email)
);

-- Auction Items
CREATE TABLE auction_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id int4,
  service text NOT NULL,
  honor text NOT NULL,
  description text,
  starting_bid int4 NOT NULL DEFAULT 0,
  current_bid numeric NOT NULL DEFAULT 0,
  minimum_increment numeric NOT NULL DEFAULT 1,
  current_bidder_id uuid,
  current_bidder text,
  is_paid bool DEFAULT false,
  paid_at timestamp,
  display_order int4 NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Bid History
CREATE TABLE bid_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_item_id uuid NOT NULL,
  bidder_id uuid,
  bidder_name text NOT NULL,
  bidder_email text,
  bid_amount int4 NOT NULL,
  is_winning_bid bool DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Holiday Templates
CREATE TABLE holiday_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  services _text NOT NULL DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT holiday_templates_name_key UNIQUE (name)
);

-- Bid Item Templates
CREATE TABLE bid_item_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id uuid NOT NULL,
  service text NOT NULL,
  honor text NOT NULL,
  description text,
  starting_bid numeric NOT NULL DEFAULT 18,
  minimum_increment numeric NOT NULL DEFAULT 1,
  display_order int4 NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Email Log
CREATE TABLE email_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_email text NOT NULL,
  email_type text NOT NULL,
  auction_item_id uuid,
  auction_id int4,
  status text NOT NULL DEFAULT 'sent'::text,
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Stripe Accounts
CREATE TABLE stripe_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_account_id text NOT NULL,
  access_token text,
  refresh_token text,
  stripe_user_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT stripe_accounts_stripe_account_id_key UNIQUE (stripe_account_id)
);

-- Stripe Payments
CREATE TABLE stripe_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_intent_id text NOT NULL,
  auction_item_ids _uuid NOT NULL,
  bidder_email text NOT NULL,
  amount int4 NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT stripe_payments_payment_intent_id_key UNIQUE (payment_intent_id)
);

-- Payment Settings (optional, not used in current codebase)
CREATE TABLE payment_settings (
  id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid PRIMARY KEY,
  installments_enabled bool NOT NULL DEFAULT false,
  max_installments int4 NOT NULL DEFAULT 12,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Auction Settings (legacy, can be removed if not used)
CREATE TABLE auction_settings (
  id int4 NOT NULL DEFAULT nextval('auction_settings_id_seq'::regclass) PRIMARY KEY,
  end_time timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- FOREIGN KEYS
-- ============================================================================

ALTER TABLE auction_items 
  ADD CONSTRAINT fk_auction_items_auction_id 
  FOREIGN KEY (auction_id) REFERENCES auction_config(id) ON DELETE CASCADE;

ALTER TABLE auction_items 
  ADD CONSTRAINT fk_auction_items_current_bidder_id 
  FOREIGN KEY (current_bidder_id) REFERENCES bidders(id) ON DELETE SET NULL;

ALTER TABLE bid_history 
  ADD CONSTRAINT bid_history_auction_item_id_fkey 
  FOREIGN KEY (auction_item_id) REFERENCES auction_items(id) ON DELETE CASCADE;

ALTER TABLE bid_history 
  ADD CONSTRAINT fk_bid_history_bidder_id 
  FOREIGN KEY (bidder_id) REFERENCES bidders(id) ON DELETE SET NULL;

ALTER TABLE bid_item_templates 
  ADD CONSTRAINT bid_item_templates_template_id_fkey 
  FOREIGN KEY (template_id) REFERENCES holiday_templates(id) ON DELETE CASCADE;

ALTER TABLE email_log 
  ADD CONSTRAINT email_log_auction_item_id_fkey 
  FOREIGN KEY (auction_item_id) REFERENCES auction_items(id) ON DELETE CASCADE;

ALTER TABLE email_log 
  ADD CONSTRAINT email_log_auction_id_fkey 
  FOREIGN KEY (auction_id) REFERENCES auction_config(id) ON DELETE CASCADE;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Auction Config
CREATE INDEX idx_auction_config_status ON auction_config USING btree (status);
CREATE INDEX idx_auction_config_end_time ON auction_config USING btree (end_time);

-- Bidders
CREATE INDEX idx_bidders_email ON bidders USING btree (email);

-- Auction Items
CREATE INDEX idx_auction_items_auction_id ON auction_items USING btree (auction_id);
CREATE INDEX idx_auction_items_current_bidder_id ON auction_items USING btree (current_bidder_id);
CREATE INDEX idx_auction_items_display_order ON auction_items USING btree (display_order);
CREATE INDEX auction_items_service_idx ON auction_items USING btree (service);
CREATE INDEX auction_items_display_order_idx ON auction_items USING btree (display_order);

-- Bid History
CREATE INDEX idx_bid_history_auction_item_id ON bid_history USING btree (auction_item_id);
CREATE INDEX idx_bid_history_bidder_id ON bid_history USING btree (bidder_id);
CREATE INDEX idx_bid_history_created_at ON bid_history USING btree (created_at DESC);
CREATE INDEX idx_bid_history_email ON bid_history USING btree (bidder_email);
CREATE INDEX idx_bid_history_is_winning_bid ON bid_history USING btree (is_winning_bid) WHERE (is_winning_bid = false);

-- Holiday Templates
CREATE INDEX idx_holiday_templates_name ON holiday_templates USING btree (name);

-- Bid Item Templates
CREATE INDEX idx_bid_item_templates_template_id ON bid_item_templates USING btree (template_id);
CREATE INDEX idx_bid_item_templates_display_order ON bid_item_templates USING btree (display_order);

-- Email Log
CREATE INDEX idx_email_log_recipient_email ON email_log USING btree (recipient_email);
CREATE INDEX idx_email_log_email_type ON email_log USING btree (email_type);
CREATE INDEX idx_email_log_auction_item_id ON email_log USING btree (auction_item_id);
CREATE INDEX idx_email_log_auction_id ON email_log USING btree (auction_id);
CREATE INDEX idx_email_log_sent_at ON email_log USING btree (sent_at DESC);

-- Stripe Accounts
CREATE INDEX idx_stripe_accounts_stripe_account_id ON stripe_accounts USING btree (stripe_account_id);

-- Stripe Payments
CREATE INDEX idx_stripe_payments_payment_intent_id ON stripe_payments USING btree (payment_intent_id);
CREATE INDEX idx_stripe_payments_bidder_email ON stripe_payments USING btree (bidder_email);
CREATE INDEX idx_stripe_payments_status ON stripe_payments USING btree (status);
CREATE INDEX idx_stripe_payments_created_at ON stripe_payments USING btree (created_at DESC);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Place bid function (atomic bid placement with locking)
CREATE OR REPLACE FUNCTION place_bid(
    p_item_id uuid, 
    p_bidder_name text, 
    p_bidder_email text, 
    p_bid_amount numeric
)
RETURNS TABLE(current_bid numeric, previous_bidder_email text, item_title text)
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_bid NUMERIC;
    v_minimum_increment NUMERIC;
    v_starting_bid NUMERIC;
    v_previous_bidder_email TEXT;
    v_previous_bidder_id UUID;
    v_new_bidder_id UUID;
    v_service TEXT;
    v_honor TEXT;
    v_auction_id INTEGER;
BEGIN
    -- Lock the auction item row for update
    SELECT 
        ai.current_bid, 
        ai.minimum_increment, 
        ai.starting_bid,
        ai.current_bidder_id,
        ai.service,
        ai.honor,
        ai.auction_id
    INTO 
        v_current_bid, 
        v_minimum_increment, 
        v_starting_bid,
        v_previous_bidder_id,
        v_service,
        v_honor,
        v_auction_id
    FROM auction_items ai
    WHERE ai.id = p_item_id
    FOR UPDATE;
    
    -- Check if item exists
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Auction item not found';
    END IF;
    
    -- Get previous bidder email
    IF v_previous_bidder_id IS NOT NULL THEN
        SELECT email INTO v_previous_bidder_email
        FROM bidders
        WHERE id = v_previous_bidder_id;
    END IF;
    
    -- Validate bid amount
    IF p_bid_amount < v_current_bid + v_minimum_increment THEN
        RAISE EXCEPTION 'Bid must be at least $% (current bid $% + minimum increment $%)', 
            v_current_bid + v_minimum_increment, v_current_bid, v_minimum_increment;
    END IF;
    
    -- Find or create bidder
    SELECT id INTO v_new_bidder_id
    FROM bidders
    WHERE email = p_bidder_email;
    
    IF v_new_bidder_id IS NULL THEN
        INSERT INTO bidders (full_name, email)
        VALUES (p_bidder_name, p_bidder_email)
        RETURNING id INTO v_new_bidder_id;
    ELSE
        -- Update bidder name if it changed
        UPDATE bidders
        SET full_name = p_bidder_name, updated_at = NOW()
        WHERE id = v_new_bidder_id;
    END IF;
    
    -- Mark previous winning bid as no longer winning
    IF v_previous_bidder_id IS NOT NULL THEN
        UPDATE bid_history
        SET is_winning_bid = false
        WHERE auction_item_id = p_item_id 
          AND bidder_id = v_previous_bidder_id 
          AND is_winning_bid = true;
    END IF;
    
    -- Update auction item with new bid
    UPDATE auction_items
    SET 
        current_bid = p_bid_amount,
        current_bidder_id = v_new_bidder_id,
        updated_at = NOW()
    WHERE id = p_item_id;
    
    -- Record bid in history as winning bid
    INSERT INTO bid_history (
        auction_item_id,
        bidder_id,
        bid_amount,
        bidder_name,
        bidder_email,
        is_winning_bid,
        created_at
    ) VALUES (
        p_item_id,
        v_new_bidder_id,
        p_bid_amount,
        p_bidder_name,
        p_bidder_email,
        true,
        NOW()
    );
    
    -- Return results
    RETURN QUERY
    SELECT 
        p_bid_amount,
        v_previous_bidder_email,
        v_service || ' - ' || v_honor;
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Add updated_at triggers for tables that need them
CREATE TRIGGER update_auction_config_updated_at 
    BEFORE UPDATE ON auction_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auction_items_updated_at 
    BEFORE UPDATE ON auction_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bidders_updated_at 
    BEFORE UPDATE ON bidders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_holiday_templates_updated_at 
    BEFORE UPDATE ON holiday_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bid_item_templates_updated_at 
    BEFORE UPDATE ON bid_item_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stripe_accounts_updated_at 
    BEFORE UPDATE ON stripe_accounts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stripe_payments_updated_at 
    BEFORE UPDATE ON stripe_payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables (optional - adjust based on your security needs)
ALTER TABLE auction_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bidders ENABLE ROW LEVEL SECURITY;
ALTER TABLE bid_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE holiday_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE bid_item_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_payments ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (allow all for now - adjust as needed)
CREATE POLICY "Allow all access to auction_config" ON auction_config FOR ALL USING (true);
CREATE POLICY "Allow all access to auction_items" ON auction_items FOR ALL USING (true);
CREATE POLICY "Allow all access to bidders" ON bidders FOR ALL USING (true);
CREATE POLICY "Allow all access to bid_history" ON bid_history FOR ALL USING (true);
CREATE POLICY "Allow all access to holiday_templates" ON holiday_templates FOR ALL USING (true);
CREATE POLICY "Allow all access to bid_item_templates" ON bid_item_templates FOR ALL USING (true);
CREATE POLICY "Allow all access to email_log" ON email_log FOR ALL USING (true);
CREATE POLICY "Allow all access to stripe_accounts" ON stripe_accounts FOR ALL USING (true);
CREATE POLICY "Allow all access to stripe_payments" ON stripe_payments FOR ALL USING (true);