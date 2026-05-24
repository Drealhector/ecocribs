import { Card, CardContent } from '@/components/design/Card';
import { ScrollText } from 'lucide-react';

export default function AuditLog() {
  return (
    <div className="container py-8 space-y-4">
      <div>
        <h1 className="font-heading text-3xl">Activity</h1>
        <p className="text-ink-soft mt-1 max-w-2xl">
          Every action across every deal — who signed what, when, and from where.
        </p>
      </div>
      <Card>
        <CardContent className="pt-12 pb-12 text-center text-ink-soft">
          <ScrollText className="h-10 w-10 mx-auto mb-3 text-ink-soft/60" />
          <p className="text-sm">Activity will appear here as deals move through the workflow.</p>
        </CardContent>
      </Card>
    </div>
  );
}
