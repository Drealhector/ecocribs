'use client';

import dynamic from 'next/dynamic';
import { Card, CardContent } from '@/components/design/Card';
import { IS_PREVIEW } from '@/lib/preview';
import { UserCircle2, Shield, FileEdit, UserCog } from 'lucide-react';

const OrganizationProfile = dynamic(
  () => import('@clerk/nextjs').then((m) => m.OrganizationProfile),
  { ssr: false },
);

const PREVIEW_MEMBERS = [
  { name: 'Tomi Akinola', email: 'tomi@ecocribsrealty.com', role: 'Documentation Officer', icon: FileEdit },
  { name: 'Chinonso Okocha', email: 'ceo@ecocribsrealty.com', role: 'Admin', icon: Shield },
  { name: 'Folake Bello', email: 'folake@ecocribsrealty.com', role: 'Manager', icon: UserCog },
  { name: 'David Ojo', email: 'david@ecocribsrealty.com', role: 'Agent', icon: UserCircle2 },
  { name: 'Amaka Ude', email: 'amaka@ecocribsrealty.com', role: 'Agent', icon: UserCircle2 },
];

export default function Team() {
  return (
    <div className="container py-8 space-y-4">
      <div>
        <h1 className="font-heading text-3xl">Team</h1>
        <p className="text-ink-soft mt-1">Admins, managers, documentation officers, and agents.</p>
      </div>
      {IS_PREVIEW ? (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              {PREVIEW_MEMBERS.map((m) => {
                const Icon = m.icon;
                return (
                  <div key={m.email} className="flex items-center gap-3 p-3 rounded-md hover:bg-canvas-warm">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-green-soft text-brand-green">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink">{m.name}</p>
                      <p className="text-xs text-ink-soft">{m.email}</p>
                    </div>
                    <span className="text-xs font-medium text-ink-muted bg-canvas-warm px-2 py-1 rounded-pill">
                      {m.role}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg bg-canvas overflow-hidden">
          <OrganizationProfile
            routing="hash"
            appearance={{ variables: { colorPrimary: '#F3860D' }, elements: { rootBox: 'w-full', cardBox: 'w-full shadow-none' } }}
          />
        </div>
      )}
    </div>
  );
}
