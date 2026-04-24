import { getManifest } from '@/lib/manifest';
import WorkerCard from '@/components/WorkerCard';

export default function Home() {
  const manifest = getManifest();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-emerald-500/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        
        {/* Hero Section */}
        <div className="text-center mb-20 space-y-4">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            ClawOps Fleet
          </h1>
          <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto">
            Deploy autonomous, Google-integrated agents directly to your environment. Select a package to begin.
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {manifest.packages.map((pkg) => (
            <WorkerCard
              key={pkg.slug}
              slug={pkg.slug}
              name={pkg.name}
              price_gbp={pkg.price_gbp}
              billing_cycle={pkg.billing_cycle}
              features={pkg.features}
              system_prompt={pkg.system_prompt}
            />
          ))}
        </div>

      </div>
    </div>
  );
}
