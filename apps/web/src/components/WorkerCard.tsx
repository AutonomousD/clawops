import Link from 'next/link';

interface WorkerCardProps {
  slug: string;
  name: string;
  price_gbp: number;
  billing_cycle: string;
  features: string[];
  system_prompt: string;
}

export default function WorkerCard({ slug, name, price_gbp, billing_cycle, features, system_prompt }: WorkerCardProps) {
  return (
    <div className="group relative flex flex-col justify-between bg-neutral-900/50 backdrop-blur-md border border-neutral-800 rounded-2xl p-8 hover:border-emerald-500/50 transition-all duration-300 shadow-xl">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">{name}</h2>
        <div className="flex items-baseline gap-1 mb-6">
          <span className="text-4xl font-extrabold text-emerald-400">£{price_gbp}</span>
          <span className="text-neutral-500 text-sm">/{billing_cycle}</span>
        </div>
        <p className="text-neutral-400 text-sm mb-6 line-clamp-3">
          {system_prompt}
        </p>
        
        <ul className="space-y-3 mb-8">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start text-sm text-neutral-300">
              <svg className="w-5 h-5 text-emerald-500 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <Link 
        href={`/deploy/${slug}`}
        className="w-full inline-flex justify-center items-center py-3 px-4 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]"
      >
        Deploy Now
      </Link>
    </div>
  );
}
