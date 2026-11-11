import { SystemSettings } from '../models/SystemSettings';
import { IssuedCertificate } from '../models/IssuedCertificate';

export async function getSettingsSingleton() {
  let settings = await SystemSettings.findOne({ key: 'barangay' });
  if (!settings) {
    settings = await SystemSettings.create({ key: 'barangay' });
  }
  return settings;
}

/**
 * Control number from scheme pattern, e.g. ABIS-YYYY-00000 -> ABIS-2026-00001.
 * Sequence is per calendar year, based on issued certificates.
 */
export async function generateControlNumber(): Promise<string> {
  const settings = await getSettingsSingleton();
  const scheme = settings.controlNumberScheme || 'ABIS-YYYY-00000';
  const now = new Date();
  const year = now.getFullYear();
  const yearStart = new Date(year, 0, 1);
  const count = await IssuedCertificate.countDocuments({ issuedAt: { $gte: yearStart } });

  const sequenceToken = scheme.match(/#{3,}/)?.[0] ?? scheme.match(/0{3,}/)?.[0];
  if (!sequenceToken) {
    return `${scheme}-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  const seq = String(count + 1).padStart(sequenceToken.length, '0');
  return scheme.replace('YYYY', String(year)).replace(sequenceToken, seq).replace('YY', String(year).slice(-2));
}
