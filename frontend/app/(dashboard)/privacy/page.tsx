import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { siteInfo } from '@/lib/site';

const sections = [
  {
    title: 'Information we collect',
    body: 'We collect the personal information you provide at the Barangay Hall or through this system, such as your name, address, household details, contact information, and other records needed for barangay services.',
  },
  {
    title: 'How we use your information',
    body: 'Your information is used to maintain resident records, issue certificates, process requests, prepare reports, and comply with legal obligations of the barangay.',
  },
  {
    title: 'How we protect your information',
    body: 'Access is limited to authorized barangay personnel. Personal data is not shared with third parties without your consent or another lawful basis under the Data Privacy Act of 2012 (RA 10173).',
  },
  {
    title: 'Your rights',
    body: 'Under RA 10173 you have the right to be informed, to access, to correct, to object, and to request erasure of your personal data. You may exercise these rights by visiting the Barangay Hall.',
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col">
      <PageHeader title="Privacy Notice" description="How Barangay Ambucao collects, uses, and protects your personal data." />
      <Card>
        <CardContent className="flex flex-col gap-5 text-sm leading-relaxed text-foreground">
          <p>
            This system processes personal information to deliver barangay services and maintain accurate records, in line with the
            Data Privacy Act of 2012 (RA 10173).
          </p>
          {sections.map((section) => (
            <section key={section.title} className="flex flex-col gap-1">
              <h2 className="text-sm font-semibold text-primary">{section.title}</h2>
              <p>{section.body}</p>
            </section>
          ))}
          <section className="flex flex-col gap-1">
            <h2 className="text-sm font-semibold text-primary">Contact us</h2>
            <p>
              For privacy concerns, visit {siteInfo.address} during office hours ({siteInfo.hours}).
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
