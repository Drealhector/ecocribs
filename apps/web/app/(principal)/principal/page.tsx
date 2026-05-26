import { redirect } from 'next/navigation';

// The Principal's job is admin management. /principal redirects to /principal/admins.
export default function PrincipalIndex(): never {
  redirect('/principal/admins');
}
