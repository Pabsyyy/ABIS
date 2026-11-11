import { PipelineStage, Types } from 'mongoose';
import { Resident } from '../models/Resident';
import { Household } from '../models/Household';
import { ServiceRecord } from '../models/ServiceRecord';
import { CertificateRequest } from '../models/CertificateRequest';
import { IssuedCertificate } from '../models/IssuedCertificate';

export interface ReportFilters {
  dateFrom?: Date;
  dateTo?: Date;
  purok?: string;
  classification?: string;
}

function matchResidents(filters: ReportFilters): Record<string, unknown> {
  const match: Record<string, unknown> = { status: 'active' };
  if (filters.purok) match.purok = filters.purok;
  if (filters.classification) match.classifications = filters.classification;
  return match;
}

export async function dashboardSummary() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalResidents,
    totalHouseholds,
    pendingRequests,
    issuedThisMonth,
    servicesThisMonth,
    sexDistribution,
    ageDistribution,
    purokDistribution,
    classificationDistribution,
    requestTrend,
  ] = await Promise.all([
    Resident.countDocuments({ status: 'active' }),
    Household.countDocuments({ status: 'active' }),
    CertificateRequest.countDocuments({ status: 'pending' }),
    IssuedCertificate.countDocuments({ issuedAt: { $gte: monthStart } }),
    ServiceRecord.countDocuments({ serviceDate: { $gte: monthStart } }),
    Resident.aggregate<{ _id: string; count: number }>([
      { $match: { status: 'active' } },
      { $group: { _id: '$sex', count: { $sum: 1 } } },
    ]),
    Resident.aggregate<{ _id: string; count: number }>([
      { $match: { status: 'active' } },
      {
        $bucket: {
          groupBy: '$birthdate',
          boundaries: [
            new Date(now.getFullYear() - 200, 0, 1),
            new Date(now.getFullYear() - 60, 0, 1),
            new Date(now.getFullYear() - 30, 0, 1),
            new Date(now.getFullYear() - 17, 0, 1),
            new Date(now.getFullYear() - 12, 0, 1),
            new Date(now.getFullYear() + 1, 0, 1),
          ],
          default: 'Other',
          output: { count: { $sum: 1 } },
        },
      },
    ]),
    Resident.aggregate<{ _id: string | null; count: number }>([
      { $match: { status: 'active' } },
      { $group: { _id: { $ifNull: ['$purok', 'Unassigned'] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Resident.aggregate<{ _id: string; count: number }>([
      { $match: { status: 'active' } },
      { $unwind: '$classifications' },
      { $group: { _id: '$classifications', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    CertificateRequest.aggregate<{ _id: string; count: number }>([
      { $match: { createdAt: { $gte: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  return {
    totalResidents,
    totalHouseholds,
    pendingRequests,
    issuedThisMonth,
    servicesThisMonth,
    sexDistribution: sexDistribution.map((d) => ({ sex: d._id, count: d.count })),
    ageDistribution: (() => {
      const ageLabels = ['60+', '31-59', '18-30', '13-17', '0-12'];
      return ageDistribution
        .filter((d) => typeof d._id !== 'string')
        .sort((a, b) => new Date(String(a._id)).getTime() - new Date(String(b._id)).getTime())
        .map((d, i) => ({ ageGroup: ageLabels[i] ?? 'Unknown', count: d.count }));
    })(),
    purokDistribution: purokDistribution.map((d) => ({ purok: d._id ?? 'Unassigned', count: d.count })),
    classificationDistribution: classificationDistribution.map((d) => ({ classification: d._id, count: d.count })),
    requestTrend: requestTrend.map((d) => ({ month: d._id, count: d.count })),
  };
}

export interface ReportResult {
  title: string;
  subtitle: string;
  columns: { key: string; label: string }[];
  rows: Record<string, string | number>[];
}

export async function generateReport(type: string, filters: ReportFilters): Promise<ReportResult> {
  const residentMatch = matchResidents(filters);
  const dateFilter = (field: string): Record<string, { $gte?: Date; $lte?: Date }> | undefined =>
    filters.dateFrom || filters.dateTo ? { [field]: { ...(filters.dateFrom ? { $gte: filters.dateFrom } : {}), ...(filters.dateTo ? { $lte: filters.dateTo } : {}) } } : undefined;

  switch (type) {
    case 'population': {
      const rows = await Resident.aggregate<Record<string, string | number>>([
        { $match: residentMatch },
        { $group: { _id: { purok: { $ifNull: ['$purok', 'Unassigned'] }, sex: '$sex' }, count: { $sum: 1 } } },
        { $project: { purok: '$_id.purok', sex: '$_id.sex', count: 1, _id: 0 } },
        { $sort: { purok: 1, sex: 1 } },
      ]);
      return {
        title: 'Resident Population Report',
        subtitle: 'Active residents by purok and sex',
        columns: [
          { key: 'purok', label: 'Purok' },
          { key: 'sex', label: 'Sex' },
          { key: 'count', label: 'Population' },
        ],
        rows,
      };
    }
    case 'demographic': {
      const rows = await Resident.aggregate<Record<string, string | number>>([
        { $match: residentMatch },
        {
          $bucket: {
            groupBy: '$birthdate',
            boundaries: [new Date(1900, 0, 1), new Date(new Date().getFullYear() - 60, 0, 1), new Date(new Date().getFullYear() - 30, 0, 1), new Date(new Date().getFullYear() - 17, 0, 1), new Date(new Date().getFullYear() - 12, 0, 1), new Date(3000, 0, 1)],
            default: 'unknown',
            output: { count: { $sum: 1 }, male: { $sum: { $cond: [{ $eq: ['$sex', 'M'] }, 1, 0] } }, female: { $sum: { $cond: [{ $eq: ['$sex', 'F'] }, 1, 0] } } },
          },
        },
        { $project: { ageGroup: '$_id', count: 1, male: 1, female: 1, _id: 0 } },
      ]);
      const now = new Date();
      const ageLabels: Record<string, string> = {
        [new Date(1900, 0, 1).toISOString()]: '60+',
        [new Date(now.getFullYear() - 60, 0, 1).toISOString()]: '31-59',
        [new Date(now.getFullYear() - 30, 0, 1).toISOString()]: '18-30',
        [new Date(now.getFullYear() - 17, 0, 1).toISOString()]: '13-17',
        [new Date(now.getFullYear() - 12, 0, 1).toISOString()]: '0-12',
      };
      return {
        title: 'Demographic Report',
        subtitle: 'Population by age group',
        columns: [
          { key: 'ageGroup', label: 'Age Group' },
          { key: 'count', label: 'Total' },
          { key: 'male', label: 'Male' },
          { key: 'female', label: 'Female' },
        ],
        rows: rows.map((r) => ({ ...r, ageGroup: ageLabels[new Date(String(r.ageGroup)).toISOString()] ?? String(r.ageGroup) })),
      };
    }
    case 'household': {
      const rows = await Household.aggregate<Record<string, string | number>>([
        { $match: { status: 'active', ...(filters.purok ? { purok: filters.purok } : {}) } },
        { $project: { householdNumber: 1, purok: 1, address: 1, memberCount: { $size: '$members' }, _id: 0 } },
        { $sort: { householdNumber: 1 } },
      ]);
      return {
        title: 'Household Report',
        subtitle: 'Active households and member counts',
        columns: [
          { key: 'householdNumber', label: 'Household No.' },
          { key: 'purok', label: 'Purok' },
          { key: 'address', label: 'Address' },
          { key: 'memberCount', label: 'Members' },
        ],
        rows,
      };
    }
    case 'classification': {
      const rows = await Resident.aggregate<Record<string, string | number>>([
        { $match: residentMatch },
        { $unwind: '$classifications' },
        { $group: { _id: '$classifications', count: { $sum: 1 } } },
        { $project: { classification: '$_id', count: 1, _id: 0 } },
        { $sort: { count: -1 } },
      ]);
      return {
        title: 'Resident Classification Report',
        subtitle: 'Active residents by classification',
        columns: [
          { key: 'classification', label: 'Classification' },
          { key: 'count', label: 'Residents' },
        ],
        rows,
      };
    }
    case 'certificate_requests': {
      const match: Record<string, unknown> = { ...(dateFilter('createdAt') ?? {}) };
      const rows = await CertificateRequest.aggregate<Record<string, string | number>>([
        { $match: match },
        { $lookup: { from: 'residents', localField: 'resident', foreignField: '_id', as: 'resident' } },
        { $unwind: '$resident' },
        ...(filters.purok ? [{ $match: { 'resident.purok': filters.purok } } as PipelineStage] : []),
        { $lookup: { from: 'certificatetypes', localField: 'certificateType', foreignField: '_id', as: 'type' } },
        { $unwind: '$type' },
        {
          $project: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            resident: { $concat: ['$resident.firstName', ' ', '$resident.lastName'] },
            type: '$type.name',
            purpose: 1,
            status: 1,
            _id: 0,
          },
        },
        { $sort: { date: -1 } },
      ]);
      return {
        title: 'Certificate Request Report',
        subtitle: 'Requests by date range',
        columns: [
          { key: 'date', label: 'Date' },
          { key: 'resident', label: 'Resident' },
          { key: 'type', label: 'Certificate Type' },
          { key: 'purpose', label: 'Purpose' },
          { key: 'status', label: 'Status' },
        ],
        rows,
      };
    }
    case 'issued_certificates': {
      const match: Record<string, unknown> = { ...(dateFilter('issuedAt') ?? {}) };
      const rows = await IssuedCertificate.aggregate<Record<string, string | number>>([
        { $match: match },
        { $lookup: { from: 'residents', localField: 'resident', foreignField: '_id', as: 'resident' } },
        { $unwind: '$resident' },
        ...(filters.purok ? [{ $match: { 'resident.purok': filters.purok } } as PipelineStage] : []),
        { $lookup: { from: 'certificatetypes', localField: 'certificateType', foreignField: '_id', as: 'type' } },
        { $unwind: '$type' },
        {
          $project: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$issuedAt' } },
            controlNumber: 1,
            resident: { $concat: ['$resident.firstName', ' ', '$resident.lastName'] },
            type: '$type.name',
            fee: 1,
            paymentStatus: 1,
            _id: 0,
          },
        },
        { $sort: { date: -1 } },
      ]);
      return {
        title: 'Issued Certificate Report',
        subtitle: 'Certificates issued by date range',
        columns: [
          { key: 'date', label: 'Date' },
          { key: 'controlNumber', label: 'Control No.' },
          { key: 'resident', label: 'Resident' },
          { key: 'type', label: 'Type' },
          { key: 'fee', label: 'Fee (PHP)' },
          { key: 'paymentStatus', label: 'Payment' },
        ],
        rows,
      };
    }
    case 'services': {
      const match: Record<string, unknown> = { ...(dateFilter('serviceDate') ?? {}) };
      const rows = await ServiceRecord.aggregate<Record<string, string>>([
        { $match: match },
        { $lookup: { from: 'residents', localField: 'resident', foreignField: '_id', as: 'resident' } },
        { $unwind: '$resident' },
        ...(filters.purok ? [{ $match: { 'resident.purok': filters.purok } } as PipelineStage] : []),
        { $lookup: { from: 'servicecategories', localField: 'category', foreignField: '_id', as: 'category' } },
        { $unwind: '$category' },
        {
          $project: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$serviceDate' } },
            resident: { $concat: ['$resident.firstName', ' ', '$resident.lastName'] },
            category: '$category.name',
            description: 1,
            _id: 0,
          },
        },
        { $sort: { date: -1 } },
      ]);
      return {
        title: 'Service Monitoring Report',
        subtitle: 'Services delivered by date range',
        columns: [
          { key: 'date', label: 'Date' },
          { key: 'resident', label: 'Resident' },
          { key: 'category', label: 'Category' },
          { key: 'description', label: 'Description' },
        ],
        rows,
      };
    }
    default:
      throw new Error(`Unknown report type: ${type}`);
  }
}

export function objectIdOrUndefined(id: string | undefined): Types.ObjectId | undefined {
  return id && Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : undefined;
}
