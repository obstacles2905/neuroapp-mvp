import { AdminSidebar } from '@/components/admin-sidebar';
import { getMe } from '@/lib/auth/session';

export default async function AdminSectionLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const me = await getMe();

  return (
    <div className="flex min-h-screen w-full">
      <AdminSidebar me={me} />
      <div className="admin-main-surface flex min-h-screen flex-1 flex-col">
        <main className="flex-1 p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
