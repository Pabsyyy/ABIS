import ExcelJS from 'exceljs';

export interface ImportRowError {
  row: number;
  message: string;
}

export interface ImportResult {
  totalRows: number;
  validRows: Record<string, unknown>[];
  errors: ImportRowError[];
}

const EXPORT_COLUMNS = [
  { header: 'First Name', key: 'firstName' },
  { header: 'Middle Name', key: 'middleName' },
  { header: 'Last Name', key: 'lastName' },
  { header: 'Suffix', key: 'suffix' },
  { header: 'Birthdate', key: 'birthdate' },
  { header: 'Sex', key: 'sex' },
  { header: 'Civil Status', key: 'civilStatus' },
  { header: 'Purok', key: 'purok' },
  { header: 'Address', key: 'address' },
  { header: 'Contact Number', key: 'contactNumber' },
  { header: 'Email', key: 'email' },
  { header: 'Occupation', key: 'occupation' },
  { header: 'Monthly Income', key: 'monthlyIncome' },
  { header: 'Classifications', key: 'classifications' },
  { header: 'Status', key: 'status' },
] as const;

export function residentsToExcelRows(residents: Record<string, unknown>[]): Record<string, unknown>[] {
  return residents.map((r) => ({
    ...r,
    birthdate: r.birthdate instanceof Date ? r.birthdate.toISOString().slice(0, 10) : r.birthdate,
    classifications: Array.isArray(r.classifications) ? (r.classifications as string[]).join(', ') : r.classifications,
  }));
}

export async function buildResidentsExcel(residents: Record<string, unknown>[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Residents');
  sheet.columns = EXPORT_COLUMNS.map((col) => ({ header: col.header, key: col.key, width: 22 }));
  sheet.getRow(1).font = { bold: true };
  sheet.addRows(residentsToExcelRows(residents));
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}

export async function parseResidentsImport(buffer: Buffer): Promise<ImportResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  const sheet = workbook.worksheets[0];
  const errors: ImportRowError[] = [];
  const validRows: Record<string, unknown>[] = [];

  if (!sheet) {
    return { totalRows: 0, validRows, errors: [{ row: 0, message: 'No worksheets found in the file' }] };
  }

  const headerRow = sheet.getRow(1);
  const headers = new Map<number, string>();
  headerRow.eachCell((cell, colNumber) => {
    const header = String(cell.value ?? '').trim().toLowerCase();
    const match = EXPORT_COLUMNS.find((c) => c.header.toLowerCase() === header);
    if (match) headers.set(colNumber, match.key);
  });

  if (headers.size < 4) {
    return { totalRows: 0, validRows, errors: [{ row: 1, message: 'Missing required headers (First Name, Last Name, Birthdate, Sex, ...)' }] };
  }

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const record: Record<string, unknown> = {};
    row.eachCell((cell, colNumber) => {
      const key = headers.get(colNumber);
      if (key) record[key] = cell.value;
    });

    const rowErrors: string[] = [];
    const firstName = String(record.firstName ?? '').trim();
    const lastName = String(record.lastName ?? '').trim();
    if (!firstName) rowErrors.push('First Name is required');
    if (!lastName) rowErrors.push('Last Name is required');

    let birthdate: Date | undefined;
    const rawBirthdate = record.birthdate;
    if (rawBirthdate instanceof Date) {
      birthdate = rawBirthdate;
    } else if (rawBirthdate !== undefined && rawBirthdate !== null && rawBirthdate !== '') {
      const parsed = new Date(String(rawBirthdate));
      if (!isNaN(parsed.getTime())) birthdate = parsed;
      else rowErrors.push(`Birthdate "${String(rawBirthdate)}" is not a valid date`);
    } else {
      rowErrors.push('Birthdate is required');
    }

    const sex = String(record.sex ?? '').trim().toUpperCase();
    if (sex !== 'M' && sex !== 'F') rowErrors.push('Sex must be M or F');

    const civilStatus = String(record.civilStatus ?? 'single').trim().toLowerCase();
    const allowedStatuses = ['single', 'married', 'widowed', 'separated', 'annulled', 'divorced'];
    if (!allowedStatuses.includes(civilStatus)) rowErrors.push('Civil Status must be one of ' + allowedStatuses.join('/'));

    const classificationsRaw = String(record.classifications ?? '').trim();
    const classifications = classificationsRaw
      ? classificationsRaw.split(/[,;]/).map((c) => c.trim().toLowerCase()).filter(Boolean)
      : [];

    if (rowErrors.length > 0) {
      errors.push({ row: rowNumber, message: rowErrors.join('; ') });
      return;
    }

    validRows.push({
      firstName,
      middleName: String(record.middleName ?? '').trim() || undefined,
      lastName,
      suffix: String(record.suffix ?? '').trim() || undefined,
      birthdate,
      sex,
      civilStatus,
      purok: String(record.purok ?? '').trim() || undefined,
      address: String(record.address ?? '').trim() || undefined,
      contactNumber: String(record.contactNumber ?? '').trim() || undefined,
      email: String(record.email ?? '').trim() || undefined,
      occupation: String(record.occupation ?? '').trim() || undefined,
      monthlyIncome: record.monthlyIncome !== undefined && record.monthlyIncome !== null && record.monthlyIncome !== '' ? Number(record.monthlyIncome) : undefined,
      classifications,
      status: 'active',
    });
  });

  return { totalRows: sheet.rowCount - 1, validRows, errors };
}

export async function buildTableExcel(title: string, rows: Record<string, unknown>[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(title.slice(0, 31));
  if (rows.length > 0) {
    const keys = Object.keys(rows[0]);
    sheet.columns = keys.map((key) => ({ header: key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).trim(), key, width: 24 }));
    sheet.getRow(1).font = { bold: true };
    sheet.addRows(rows);
  }
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}
