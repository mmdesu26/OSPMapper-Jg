-- OSP MAPPER JAGONET - sites, prices, and JC visual mapping support
CREATE TABLE IF NOT EXISTS sites (
  id CHAR(36) PRIMARY KEY,
  kode_site VARCHAR(30) NOT NULL UNIQUE,
  nama_site VARCHAR(100) NOT NULL,
  kota VARCHAR(100) NULL,
  provinsi VARCHAR(100) NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'aktif',
  catatan TEXT NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

INSERT IGNORE INTO sites (id, kode_site, nama_site, kota, provinsi, status, catatan)
VALUES
(UUID(), 'SITE-MAGETAN', 'Magetan', 'Magetan', 'Jawa Timur', 'aktif', 'Data awal sistem OSP MAPPER JAGONET'),
(UUID(), 'SITE-NGAWI', 'Ngawi', 'Ngawi', 'Jawa Timur', 'aktif', 'Data awal sistem OSP MAPPER JAGONET'),
(UUID(), 'SITE-PONOROGO', 'Ponorogo', 'Ponorogo', 'Jawa Timur', 'aktif', 'Data awal sistem OSP MAPPER JAGONET'),
(UUID(), 'SITE-BOJONEGORO', 'Bojonegoro', 'Bojonegoro', 'Jawa Timur', 'aktif', 'Data awal sistem OSP MAPPER JAGONET'),
(UUID(), 'SITE-BALI', 'Bali', 'Bali', 'Bali', 'aktif', 'Data awal sistem OSP MAPPER JAGONET');

ALTER TABLE odc ADD COLUMN IF NOT EXISTS site_id CHAR(36) NULL;
ALTER TABLE odp ADD COLUMN IF NOT EXISTS site_id CHAR(36) NULL;
ALTER TABLE joint_closure ADD COLUMN IF NOT EXISTS site_id CHAR(36) NULL;
ALTER TABLE joint_closure ADD COLUMN IF NOT EXISTS splice_connections JSON NULL;
ALTER TABLE tiang ADD COLUMN IF NOT EXISTS site_id CHAR(36) NULL;
ALTER TABLE tiang ADD COLUMN IF NOT EXISTS harga_per_unit DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE kabel ADD COLUMN IF NOT EXISTS site_id CHAR(36) NULL;
ALTER TABLE kabel ADD COLUMN IF NOT EXISTS harga_per_meter DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE kabel ADD COLUMN IF NOT EXISTS warna_kabel VARCHAR(20) NULL DEFAULT '#7C3AED';
