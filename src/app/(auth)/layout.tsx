export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-[var(--brand-white)]">
      <h1 className="text-4xl font-extrabold mb-8 text-[var(--brand-black)] tracking-tight">
        Design<span className="text-[var(--brand-red)]">Domain</span> FF&E Portal
      </h1>
      <div className="w-full max-w-md rounded-lg border border-[var(--brand-red)] bg-[var(--brand-black)] text-white shadow-lg">
        {children}
      </div>
    </div>
  );
}
