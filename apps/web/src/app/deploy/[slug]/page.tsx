import { getPackageBySlug } from '@/lib/manifest';
import { notFound } from 'next/navigation';
import DeployClient from './DeployClient';

export default async function DeployPage({ params }: { params: Promise<{ slug: string }> }) {
  // Await the params object before accessing properties like `slug`
  // as in Next.js 15, `params` is a Promise.
  const resolvedParams = await params;
  const pkg = getPackageBySlug(resolvedParams.slug);

  if (!pkg) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-emerald-500/30 py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-white mb-2">Deploying: {pkg.name}</h1>
          <p className="text-neutral-400">Please provide the required configuration parameters below to generate your provisioning payload.</p>
        </div>

        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800 rounded-2xl p-8 shadow-xl">
          <DeployClient packageSlug={pkg.slug} requiredInputs={pkg.required_inputs} />
        </div>
      </div>
    </div>
  );
}
