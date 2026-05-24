import { Card, CardContent } from '@/components/design/Card';
import { ScrollText } from 'lucide-react';

export default function AuditLog() {
  return (
    <div className="container py-8 space-y-4">
      <div>
        <h1 className="font-heading text-3xl">Audit log</h1>
        <p className="text-ink-soft mt-1 max-w-2xl">
          Every sensitive action is recorded here with a tamper-evident hash chain.
          Retention: 7 years (NDPA + buffer).
        </p>
      </div>
      <Card>
        <CardContent className="pt-12 pb-12 text-center text-ink-soft">
          <ScrollText className="h-10 w-10 mx-auto mb-3 text-ink-soft/60" />
          <p className="text-sm">Audit events will appear here once activity begins.</p>
          <p className="text-2xs mt-2 mono">
            Hash-chained · IP + UA captured · Evidence Act s.84 compliant
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
