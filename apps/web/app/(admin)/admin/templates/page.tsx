import { Card, CardContent } from '@/components/design/Card';
import { Button } from '@/components/design/Button';
import { FileText, Upload, ShieldCheck } from 'lucide-react';

export default function Templates() {
  const templates = [
    { kind: 'receipt', name: 'Receipt — Lagos v1', approved: true },
    { kind: 'offer_letter', name: 'Offer Letter — Lagos v1', approved: true },
    { kind: 'contract_of_sale', name: 'Contract of Sale — Lagos v1', approved: false },
    { kind: 'deed_of_assignment', name: 'Deed of Assignment — Lagos v1', approved: false },
  ];

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl">Templates</h1>
          <p className="text-ink-soft mt-1">
            PDF templates with merge fields. Each version must be legal-counsel approved before use.
          </p>
        </div>
        <Button><Upload className="h-4 w-4" /> Upload PDF</Button>
      </div>

      <div className="grid gap-3">
        {templates.map((t) => (
          <Card key={t.kind}>
            <CardContent className="pt-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 rounded-md bg-brand-green-soft text-brand-green grid place-items-center shrink-0">
                  <FileText className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-ink-soft mono">{t.kind}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {t.approved ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-green">
                    <ShieldCheck className="h-4 w-4" /> Counsel approved
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-gold">
                    Awaiting counsel review
                  </span>
                )}
                <Button variant="outline" size="sm">Edit fields</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
