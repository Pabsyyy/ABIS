import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from './config/db';
import { env } from './config/env';
import { User } from './models/User';
import { Classification } from './models/Classification';
import { CertificateType } from './models/CertificateType';
import { ServiceCategory } from './models/ServiceCategory';
import { SystemSettings } from './models/SystemSettings';

const classifications = [
  { key: 'senior_citizen', label: 'Senior Citizen', description: 'Resident aged 60 or older' },
  { key: 'pwd', label: 'Person with Disability', description: 'Person with disability' },
  { key: 'solo_parent', label: 'Solo Parent', description: 'Solo parent' },
  { key: 'four_ps', label: '4Ps Beneficiary', description: 'Pantawid Pamilyang Pilipino Program beneficiary' },
  { key: 'indigenous_people', label: 'Indigenous People', description: 'Indigenous cultural community member' },
  { key: 'youth', label: 'Youth (15-30)', description: 'Youth aged 15 to 30' },
  { key: 'below_poverty_line', label: 'Below Poverty Line', description: 'Below the poverty threshold' },
];

const certificateTypes = [
  { name: 'Barangay Clearance', description: 'General purpose barangay clearance', fee: 0, requiresApproval: true },
  { name: 'Certificate of Residency', description: 'Certifies residency in the barangay', fee: 0, requiresApproval: true },
  { name: 'Certificate of Indigency', description: 'Certifies that the resident belongs to an indigent family', fee: 0, requiresApproval: true },
  { name: 'Certificate of Business Clearance', description: 'Business permit support clearance', fee: 0, requiresApproval: true },
  { name: 'Certificate of Good Moral Character', description: 'Good moral character certification', fee: 0, requiresApproval: true },
  { name: 'Indigency for Assistance', description: 'Indigency endorsement for medical/financial assistance', fee: 0, requiresApproval: true },
  { name: 'Barangay ID', description: 'Barangay identification card request', fee: 0, requiresApproval: false },
  { name: 'Cedula (Community Tax Certificate)', description: 'Community tax certificate issuance', fee: 0, requiresApproval: false },
];

const serviceCategories = [
  'Medical Assistance',
  'Financial Assistance',
  'Burial Assistance',
  'Livelihood Program',
  'Feeding Program',
  'Senior Citizen Benefits',
  'PWD Benefits',
  'Solo Parent Assistance',
  '4Ps Monitoring',
  'Disaster/Calamity Assistance',
  'Indigency Endorsement',
  'Other',
];

async function seed() {
  await connectDatabase();

  const seedAccounts: Array<{ username: string; fullName: string; password: string; role: 'secretary' | 'treasurer' | 'captain' }> = [
    { username: env.seed.secretaryUsername, fullName: env.seed.secretaryFullName, password: env.seed.secretaryPassword, role: 'secretary' },
    { username: env.seed.treasurerUsername, fullName: env.seed.treasurerFullName, password: env.seed.treasurerPassword, role: 'treasurer' },
    { username: env.seed.captainUsername, fullName: env.seed.captainFullName, password: env.seed.captainPassword, role: 'captain' },
  ];

  for (const account of seedAccounts) {
    const existing = await User.findOne({ username: account.username });
    if (existing) {
      console.log(`Account "${account.username}" already exists. Skipping.`);
      continue;
    }
    const passwordHash = await bcrypt.hash(account.password, 12);
    await User.create({ ...account, passwordHash, mustChangePassword: true, createdBy: undefined });
    console.log(`Created ${account.role} account "${account.username}"`);
  }

  for (const c of classifications) {
    if (!(await Classification.findOne({ key: c.key }))) await Classification.create(c);
  }
  console.log(`Classifications seeded: ${classifications.length}`);

  for (const t of certificateTypes) {
    if (!(await CertificateType.findOne({ name: t.name }))) await CertificateType.create(t);
  }
  console.log(`Certificate types seeded: ${certificateTypes.length}`);

  for (const name of serviceCategories) {
    if (!(await ServiceCategory.findOne({ name }))) await ServiceCategory.create({ name });
  }
  console.log(`Service categories seeded: ${serviceCategories.length}`);

  if (!(await SystemSettings.findOne({ key: 'barangay' }))) {
    await SystemSettings.create({ key: 'barangay' });
    console.log('System settings (barangay singleton) created');
  }

  await disconnectDatabase();
  console.log('Seed complete.');
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
