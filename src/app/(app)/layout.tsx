import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user ?? null;

  return (
    <div className="relative z-10 flex h-screen">
      <Sidebar
        user={
          user
            ? { name: user.name, email: user.email, image: user.image }
            : null
        }
      />
      <main className="flex-1 overflow-y-auto px-4 py-4 pt-16 md:px-6 md:py-6 md:pt-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
