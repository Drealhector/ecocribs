'use client';

import { FileText, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/design/Button';
import { StatusPill } from '@/components/design/StatusPill';
import { Card, CardContent } from '@/components/design/Card';
import { formatDateShort, shortId } from '@/lib/format';

type Doc = {
  _id: string;
  kind: 'receipt' | 'offer_letter' | 'contract_of_sale' | 'survey_plan' | 'deed_of_assignment';
  status: string;
  updatedAt: number;
};

const KIND_LABEL: Record<Doc['kind'], string> = {
  receipt: 'Receipt',
  offer_letter: 'Offer Letter',
  contract_of_sale: 'Contract of Sale',
  survey_plan: 'Survey Plan',
  deed_of_assignment: 'Deed of Assignment',
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  sent: 'Sent',
  partially_signed: 'Partially signed',
  fully_signed: 'Signed',
  executed: 'Executed',
  archived: 'Archived',
};

export function DocumentViewer({ doc, onSign, onDownload }: {
  doc: Doc;
  onSign?: () => void;
  onDownload?: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="bg-canvas-warm border-b border-border-subtle p-4 flex items-center gap-4">
        <div className="h-12 w-12 rounded-md bg-brand-green-soft text-brand-green grid place-items-center shrink-0">
          <FileText className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h3 className="font-heading text-lg font-medium text-ink truncate">
              {KIND_LABEL[doc.kind]}
            </h3>
            <StatusPill label={STATUS_LABEL[doc.status] ?? doc.status} />
          </div>
          <p className="text-xs text-ink-soft mt-0.5 mono tabular">
            #{shortId(doc._id)} · Updated {formatDateShort(doc.updatedAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onDownload && (
            <Button variant="ghost" size="icon" onClick={onDownload} aria-label="Download">
              <Download className="h-4 w-4" />
            </Button>
          )}
          <Button variant="outline" size="sm">
            <ExternalLink className="h-4 w-4" />
            View
          </Button>
        </div>
      </div>

      <CardContent className="pt-6">
        {/* PDF embed will live here. For MVP we use an <iframe> against a
            signed R2 URL minted server-side. Page-turn affordances + zoom
            handled in phase 2 with PDF.js. */}
        <div className="aspect-[8.5/11] w-full rounded-md bg-canvas-warm border border-border grid place-items-center text-ink-soft">
          <span className="text-sm">PDF preview will render here</span>
        </div>

        {onSign && doc.status !== 'fully_signed' && (
          <div className="mt-4">
            <Button onClick={onSign} size="lg" className="w-full md:w-auto">
              Sign this document
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
