import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { siteInfo } from '@/lib/site';

export default function ContactPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col">
      <PageHeader title="Contact" description="Reach the Barangay Ambucao office for assistance." />
      <Card>
        <CardContent className="flex flex-col gap-4 text-sm leading-relaxed text-foreground">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <p className="text-xs uppercase text-muted">Address</p>
              <p>{siteInfo.address}</p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs uppercase text-muted">Office hours</p>
              <p>{siteInfo.hours}</p>
            </div>
            {siteInfo.phone && (
              <div className="flex flex-col gap-1">
                <p className="text-xs uppercase text-muted">Phone</p>
                <a href={`tel:${siteInfo.phone}`} className="hover:text-primary">{siteInfo.phone}</a>
              </div>
            )}
            {siteInfo.email && (
              <div className="flex flex-col gap-1">
                <p className="text-xs uppercase text-muted">Email</p>
                <a href={`mailto:${siteInfo.email}`} className="hover:text-primary">{siteInfo.email}</a>
              </div>
            )}
          </div>
          <p className="text-muted">
            For account concerns such as password resets or linking your account to your resident record, visit the Barangay Hall
            and look for the Barangay Secretary.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
