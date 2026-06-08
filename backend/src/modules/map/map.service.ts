import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class MapService {
  constructor(@InjectDataSource() private ds: DataSource) {}

  private parseJson(value: any) {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try { return JSON.parse(value); } catch { return []; }
    }
    return [];
  }

  async getAllAssets() {
    const odc = await this.ds.query(`
      SELECT o.id, 'odc' AS asset_type, o.kode_odc AS kode, o.nama_odc AS nama,
             o.latitude, o.longitude, o.status, o.kapasitas_port, o.port_terpakai,
             ROUND(o.port_terpakai / NULLIF(o.kapasitas_port,0) * 100, 1) AS utilisasi_pct,
             s.id AS site_id, s.nama_site AS site_name
      FROM odc o
      LEFT JOIN sites s ON s.id = o.site_id
      WHERE o.deleted_at IS NULL`);

    const odp = await this.ds.query(`
      SELECT o.id, 'odp' AS asset_type, o.kode_odp AS kode, o.nama_odp AS nama,
             o.latitude, o.longitude, o.status, o.kapasitas_port, o.port_terpakai,
             ROUND(o.port_terpakai / NULLIF(o.kapasitas_port,0) * 100, 1) AS utilisasi_pct,
             s.id AS site_id, s.nama_site AS site_name
      FROM odp o
      LEFT JOIN sites s ON s.id = o.site_id
      WHERE o.deleted_at IS NULL`);

    const jc = await this.ds.query(`
      SELECT j.id, 'jc' AS asset_type, j.kode_jc AS kode, j.kode_jc AS nama,
             j.latitude, j.longitude, 'aktif' AS status,
             j.jumlah_core_in, j.jumlah_core_out, j.tipe_jc,
             s.id AS site_id, s.nama_site AS site_name
      FROM joint_closure j
      LEFT JOIN sites s ON s.id = j.site_id
      WHERE j.deleted_at IS NULL`);

    const tiang = await this.ds.query(`
      SELECT t.id, 'tiang' AS asset_type, t.kode_tiang AS kode, COALESCE(t.nomor_tiang, t.kode_tiang) AS nama,
             t.latitude, t.longitude, t.status, t.jenis_tiang, t.tinggi_meter, t.harga_per_unit,
             s.id AS site_id, s.nama_site AS site_name
      FROM tiang t
      LEFT JOIN sites s ON s.id = t.site_id
      WHERE t.deleted_at IS NULL`);

    const kabel = await this.ds.query(`
      SELECT k.id, 'kabel' AS asset_type, k.kode_kabel AS kode, k.nama_kabel AS nama,
             k.status, k.jumlah_core, k.core_terpakai, k.panjang_meter, k.harga_per_meter,
             (COALESCE(k.panjang_meter,0) * COALESCE(k.harga_per_meter,0)) AS total_harga,
             k.warna_kabel, k.route_points,
             s.id AS site_id, s.nama_site AS site_name
      FROM kabel k
      LEFT JOIN sites s ON s.id = k.site_id
      WHERE k.deleted_at IS NULL`);

    const toFeature = (row: any) => {
      const points = this.parseJson(row.route_points);
      if (row.asset_type === 'kabel') {
        if (!points.length) return null;
        const coords = points
          .map((point: any) => [parseFloat(point.longitude), parseFloat(point.latitude)])
          .filter(([lng, lat]: number[]) => !Number.isNaN(lng) && !Number.isNaN(lat));
        if (coords.length < 2) return null;
        return {
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: coords },
          properties: { ...row, latitude: undefined, longitude: undefined, route_points: undefined },
        };
      }

      const [lng, lat] = [parseFloat(row.longitude), parseFloat(row.latitude)];
      if (Number.isNaN(lng) || Number.isNaN(lat)) return null;
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lng, lat] },
        properties: { ...row, latitude: undefined, longitude: undefined, route_points: undefined },
      };
    };

    return {
      type: 'FeatureCollection',
      features: [...odc, ...odp, ...jc, ...tiang, ...kabel]
        .map(toFeature)
        .filter(Boolean),
    };
  }

  async getDashboardStats(months?: string) {
  const selectedMonths = ['1', '2', '3'].includes(String(months))
    ? Number(months)
    : null;

  const startDate = selectedMonths
    ? new Date(new Date().setMonth(new Date().getMonth() - selectedMonths))
    : null;

  const siteDateWhere = startDate ? 'AND created_at >= ?' : '';
  const odcDateWhere = startDate ? 'AND created_at >= ?' : '';
  const odpDateWhere = startDate ? 'AND created_at >= ?' : '';
  const jcDateWhere = startDate ? 'AND created_at >= ?' : '';
  const tiangDateWhere = startDate ? 'AND created_at >= ?' : '';
  const kabelDateWhere = startDate ? 'AND created_at >= ?' : '';

  const siteParams = startDate ? [startDate] : [];
  const odcParams = startDate ? [startDate] : [];
  const odpParams = startDate ? [startDate] : [];
  const jcParams = startDate ? [startDate] : [];
  const tiangParams = startDate ? [startDate] : [];
  const kabelParams = startDate ? [startDate] : [];

  const [siteStats] = await this.ds.query(
    `
    SELECT COUNT(*) AS total
    FROM sites
    WHERE deleted_at IS NULL
    ${siteDateWhere}
    `,
    siteParams,
  );

  const [odcStats] = await this.ds.query(
    `
    SELECT COUNT(*) AS total,
           COALESCE(SUM(port_terpakai), 0) AS port_terpakai
    FROM odc
    WHERE deleted_at IS NULL
    ${odcDateWhere}
    `,
    odcParams,
  );

  const [odpStats] = await this.ds.query(
    `
    SELECT COUNT(*) AS total
    FROM odp
    WHERE deleted_at IS NULL
    ${odpDateWhere}
    `,
    odpParams,
  );

  const [jcStats] = await this.ds.query(
    `
    SELECT COUNT(*) AS total
    FROM joint_closure
    WHERE deleted_at IS NULL
    ${jcDateWhere}
    `,
    jcParams,
  );

  const [tiangStats] = await this.ds.query(
    `
    SELECT COUNT(*) AS total,
           COALESCE(SUM(harga_per_unit), 0) AS nilai_tiang
    FROM tiang
    WHERE deleted_at IS NULL
    ${tiangDateWhere}
    `,
    tiangParams,
  );

  const [kabelStats] = await this.ds.query(
    `
    SELECT COUNT(*) AS total,
           COALESCE(SUM(jumlah_core), 0) AS total_core,
           COALESCE(SUM(core_terpakai), 0) AS core_used,
           COALESCE(SUM(panjang_meter) / 1000, 0) AS total_km,
           COALESCE(SUM(panjang_meter * harga_per_meter), 0) AS nilai_kabel
    FROM kabel
    WHERE deleted_at IS NULL
    ${kabelDateWhere}
    `,
    kabelParams,
  );

  const [coreStats] = await this.ds.query(`
    SELECT COUNT(CASE WHEN status = 'used' THEN 1 END) AS used,
           COUNT(CASE WHEN status = 'spare' THEN 1 END) AS spare,
           COUNT(CASE WHEN status = 'broken' THEN 1 END) AS broken,
           COUNT(CASE WHEN status = 'reserved' THEN 1 END) AS reserved
    FROM cable_cores
  `);

  const odcDateJoin = startDate ? 'AND o.created_at >= ?' : '';
  const odpDateJoin = startDate ? 'AND op.created_at >= ?' : '';
  const jcDateJoin = startDate ? 'AND j.created_at >= ?' : '';
  const tiangDateJoin = startDate ? 'AND t.created_at >= ?' : '';
  const kabelDateJoin = startDate ? 'AND k.created_at >= ?' : '';

  const bySiteParams = startDate
    ? [startDate, startDate, startDate, startDate, startDate]
    : [];

  const bySite = await this.ds.query(
    `
    SELECT s.id, s.nama_site,
      COUNT(DISTINCT o.id) AS odc,
      COUNT(DISTINCT op.id) AS odp,
      COUNT(DISTINCT j.id) AS jc,
      COUNT(DISTINCT t.id) AS tiang,
      COUNT(DISTINCT k.id) AS kabel
    FROM sites s
    LEFT JOIN odc o
      ON o.site_id = s.id
      AND o.deleted_at IS NULL
      ${odcDateJoin}
    LEFT JOIN odp op
      ON op.site_id = s.id
      AND op.deleted_at IS NULL
      ${odpDateJoin}
    LEFT JOIN joint_closure j
      ON j.site_id = s.id
      AND j.deleted_at IS NULL
      ${jcDateJoin}
    LEFT JOIN tiang t
      ON t.site_id = s.id
      AND t.deleted_at IS NULL
      ${tiangDateJoin}
    LEFT JOIN kabel k
      ON k.site_id = s.id
      AND k.deleted_at IS NULL
      ${kabelDateJoin}
    WHERE s.deleted_at IS NULL
    GROUP BY s.id, s.nama_site
    ORDER BY s.nama_site ASC
    `,
    bySiteParams,
  );

  const toNum = (v: any) => Number(v || 0);

  return {
    site: {
      total: toNum(siteStats.total),
    },
    odc: {
      total: toNum(odcStats.total),
      port_terpakai: toNum(odcStats.port_terpakai),
    },
    odp: {
      total: toNum(odpStats.total),
    },
    jc: {
      total: toNum(jcStats.total),
    },
    tiang: {
      total: toNum(tiangStats.total),
      nilai_tiang: toNum(tiangStats.nilai_tiang),
    },
    kabel: {
      total: toNum(kabelStats.total),
      total_km: toNum(kabelStats.total_km).toFixed(1),
      nilai_kabel: toNum(kabelStats.nilai_kabel),
    },
    core: {
      used: toNum(coreStats.used),
      spare: toNum(coreStats.spare),
      broken: toNum(coreStats.broken),
      reserved: toNum(coreStats.reserved),
    },
    bySite: bySite.map((item: any) => ({
      nama_site: item.nama_site,
      odc: toNum(item.odc),
      odp: toNum(item.odp),
      jc: toNum(item.jc),
      tiang: toNum(item.tiang),
      kabel: toNum(item.kabel),
    })),
  };
} 
}