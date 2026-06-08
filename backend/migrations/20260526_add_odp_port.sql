-- Migration: add odp_port table and populate initial rows
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS odp_port (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  odp_id uuid REFERENCES odp(id) ON DELETE CASCADE,
  port_number smallint NOT NULL,
  customer_name text,
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_odp_port_odp_portnum ON odp_port(odp_id, port_number);

-- populate initial ports for existing ODPs if table empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM odp_port) THEN
    INSERT INTO odp_port (odp_id, port_number, created_at, updated_at)
    SELECT o.id, s, now(), now()
    FROM odp o
    CROSS JOIN LATERAL generate_series(1, o.kapasitas_port) s;
  END IF;
END$$;
