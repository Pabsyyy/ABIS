import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { siteInfo } from '@/lib/site';

const faqs = [
  {
    question: 'How do I request a certificate?',
    answer: 'Open My Requests or Home, choose the certificate type, and describe its purpose. The Barangay Captain reviews the request before issuance.',
  },
  {
    question: 'How much do certificates cost?',
    answer: 'Fees depend on the certificate type and are shown in the certificate list. Payment is recorded at the Barangay Hall.',
  },
  {
    question: 'How do I correct my record?',
    answer: 'Use My Profile and submit a correction request. Only the Barangay Secretary can apply changes to your record.',
  },
  {
    question: 'I forgot my password. What should I do?',
    answer: 'Contact the Barangay Secretary at the Barangay Hall to reset your password. For security, passwords are never shared over this system.',
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col">
      <PageHeader title="Help" description="Common questions about using the Integrated Barangay Information System." />
      <Card>
        <CardContent className="flex flex-col gap-5 text-sm leading-relaxed text-foreground">
          {faqs.map((faq) => (
            <section key={faq.question} className="flex flex-col gap-1">
              <h2 className="text-sm font-semibold text-primary">{faq.question}</h2>
              <p>{faq.answer}</p>
            </section>
          ))}
          <section className="flex flex-col gap-1">
            <h2 className="text-sm font-semibold text-primary">Still need help?</h2>
            <p>
              Visit {siteInfo.address} during office hours ({siteInfo.hours}) and look for the Barangay Secretary.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
