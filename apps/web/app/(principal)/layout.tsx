import { PrincipalShell } from '@/components/principal/PrincipalShell';

export default function PrincipalLayout({ children }: { children: React.ReactNode }) {
  return <PrincipalShell>{children}</PrincipalShell>;
}
