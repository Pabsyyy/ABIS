import PDFDocument from 'pdfkit';
import { Types } from 'mongoose';
import { ISystemSettings } from '../models/SystemSettings';

interface CertificatePdfInput {
  settings: ISystemSettings;
  resident: { firstName: string; middleName?: string; lastName: string; suffix?: string; birthdate?: Date; address?: string; purok?: string; civilStatus?: string };
  certificateTypeName: string;
  controlNumber: string;
  purpose: string;
  fee: number;
  orNumber?: string;
  issuedAt: Date;
}

export function certificatePdfBuffer(input: CertificatePdfInput): Promise<Buffer> {
  const { settings, resident, certificateTypeName, controlNumber, purpose, fee, orNumber, issuedAt } = input;
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 48, bottom: 48, left: 64, right: 64 } });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const ink = '#0B2A4A';
    doc.fillColor(ink);
    doc.lineWidth(0.5);

    // Letterhead
    doc.fontSize(10).text('Republic of the Philippines', { align: 'center' });
    doc.fontSize(10).text(`Province of ${settings.province}`, { align: 'center' });
    doc.fontSize(10).text(`Municipality of ${settings.municipality}`, { align: 'center' });
    doc.fontSize(16).font('Helvetica-Bold').text(settings.barangayName.toUpperCase(), { align: 'center' });
    if (settings.letterheadText) {
      doc.fontSize(9).font('Helvetica').text(settings.letterheadText, { align: 'center' });
    }
    if (settings.contactNumber) {
      doc.fontSize(8).font('Helvetica').text(`Tel. No. ${settings.contactNumber}`, { align: 'center' });
    }
    doc.moveTo(64, doc.y + 6).lineTo(531, doc.y + 6).strokeColor('#1469D4').lineWidth(2).stroke();
    doc.moveDown(1.5);

    // Title
    doc.fontSize(15).font('Helvetica-Bold').fillColor(ink).text(certificateTypeName.toUpperCase(), { align: 'center' });
    doc.moveDown(1.2);

    // Body
    doc.fontSize(11).font('Helvetica').fillColor('#163B63');
    const fullName = [resident.firstName, resident.middleName, resident.lastName, resident.suffix].filter(Boolean).join(' ');
    doc.text('This is to certify that', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(16).font('Helvetica-Bold').fillColor(ink).text(fullName.toUpperCase(), { align: 'center' });
    doc.fontSize(11).font('Helvetica').fillColor('#163B63');
    doc.text(`a resident of ${[resident.purok, resident.address].filter(Boolean).join(', ') || 'Barangay Ambucao'},`, { align: 'center' });
    doc.moveDown(0.8);
    doc.text(`is hereby issued this ${certificateTypeName} for the purpose of`, { align: 'center' });
    doc.font('Helvetica-Oblique').text(`"${purpose}"`, { align: 'center' });
    doc.moveDown(0.8);
    doc.text('Given this day of ' + issuedAt.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) + ' at the Office of the Punong Barangay, Barangay Ambucao.', { align: 'center' });

    doc.moveDown(2);
    // Signature block
    const signatureY = doc.y;
    doc.fontSize(11).font('Helvetica-Bold').text(settings.captainName || 'PUNONG BARANGAY', 330, signatureY, { width: 200, align: 'center' });
    doc.moveTo(330, signatureY + 16).lineTo(530, signatureY + 16).strokeColor(ink).lineWidth(0.75).stroke();
    doc.fontSize(9).font('Helvetica').text('Punong Barangay', 330, signatureY + 20, { width: 200, align: 'center' });

    // Footer: control number + fee
    doc.fontSize(8).fillColor('#64748B');
    doc.text(`Control No.: ${controlNumber}`, 64, 780);
    doc.text(`Fee: PHP ${fee.toFixed(2)}`, 64, 792);
    if (orNumber) doc.text(`O.R. No.: ${orNumber}`, 64, 804);
    doc.text('This certificate is issued upon request of the above-named resident.', 64, 816, { width: 467, align: 'left' });

    doc.end();
  });
}

export interface ReportColumn { key: string; label: string; width?: number }
export interface ReportPdfInput {
  settings: ISystemSettings;
  title: string;
  subtitle?: string;
  filters?: string;
  columns: ReportColumn[];
  rows: Record<string, string | number>[];
}

export function reportPdfBuffer(input: ReportPdfInput): Promise<Buffer> {
  const { settings, title, subtitle, filters, columns, rows } = input;
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 40, bottom: 40, left: 40, right: 40 }, layout: 'landscape' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(9).fillColor('#0B2A4A').text(`${settings.barangayName}, ${settings.municipality}, ${settings.province}`, { align: 'center' });
    doc.fontSize(14).font('Helvetica-Bold').text(title, { align: 'center' });
    if (subtitle) doc.fontSize(10).font('Helvetica').text(subtitle, { align: 'center' });
    if (filters) doc.fontSize(8).fillColor('#64748B').text(filters, { align: 'center' });
    doc.moveDown(0.75);

    const startX = 40;
    const pageWidth = 841.89 - 80;
    const colWidth = (col: ReportColumn) => col.width ?? pageWidth / columns.length;
    const rowHeight = 18;

    const drawRow = (y: number, values: string[], header = false, zebra = false) => {
      doc.font(header ? 'Helvetica-Bold' : 'Helvetica').fontSize(7);
      doc.rect(startX, y, pageWidth, rowHeight).fill(header ? '#0B2A4A' : zebra ? '#F5F9FD' : '#FFFFFF');
      doc.strokeColor('#D9E6F2').lineWidth(0.5).rect(startX, y, pageWidth, rowHeight).stroke();
      let cx = startX;
      values.forEach((value, i) => {
        const w = colWidth(columns[i]);
        doc.fillColor(header ? '#FFFFFF' : '#163B63').text(value, cx + 3, y + 5, { width: w - 6, height: rowHeight - 4, ellipsis: true });
        cx += w;
      });
      return y + rowHeight;
    };

    let y = doc.y;
    y = drawRow(y, columns.map((c) => c.label), true);
    rows.forEach((row, index) => {
      if (y > 530) {
        doc.addPage({ layout: 'landscape', margin: 40 });
        y = 40;
        y = drawRow(y, columns.map((c) => c.label), true);
      }
      y = drawRow(y, columns.map((c) => String(row[c.key] ?? '')), false, index % 2 === 1);
    });

    doc.fontSize(7).fillColor('#64748B');
    doc.text(`Generated ${new Date().toLocaleString('en-PH')} — ABIS, Barangay Ambucao. Total rows: ${rows.length}`, 40, 555, { align: 'left' });
    doc.end();
  });
}

export function objectIdString(id: Types.ObjectId | string | undefined): string {
  return id ? String(id) : '';
}
