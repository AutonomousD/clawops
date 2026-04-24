import Link from 'next/link';
import { headers } from 'next/headers';

export default async function SuccessPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ jwt?: string; slug?: string }> 
}) {
  const resolvedParams = await searchParams;
  const jwtToken = resolvedParams.jwt || '';
  const slug = resolvedParams.slug || 'Unknown Package';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://clawops-production-de73.up.railway.app';

  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  const isAndroid = /android/i.test(userAgent);

  const intentUrl = `intent:#Intent;action=com.termux.service_execute;component=com.termux/.app.TermuxActivity;S.com.termux.extra.COMMAND_LINE=curl%20-sL%20${apiUrl}/setup/install.sh%20|%20bash%20-s%20--%20${jwtToken};end`;

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-red-600/30 py-20 px-4 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full bg-black border border-white/20 p-10 text-center">
        
        {/* Minimalist Nothing-style logo element */}
        <div className="inline-flex items-center justify-center w-20 h-20 border-2 border-white rounded-full mb-8 relative">
           <div className="w-6 h-6 bg-red-600 rounded-full animate-pulse" />
           <div className="absolute top-0 right-0 w-3 h-3 bg-white rounded-full -mt-1 -mr-1" />
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter uppercase">Ready to Launch</h1>
        <p className="text-lg text-neutral-400 mb-12 tracking-wider">
          Payload for <strong className="text-white uppercase">{slug}</strong> secured.
        </p>

        {jwtToken ? (
          <div className="space-y-8">
            {isAndroid ? (
              <a
                href={intentUrl}
                className="w-full block py-8 px-6 text-xl md:text-2xl font-black tracking-[0.1em] md:tracking-[0.2em] text-black bg-white hover:bg-neutral-200 transition-all uppercase border-4 border-white shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] active:shadow-none active:translate-x-2 active:translate-y-2"
              >
                <span className="flex items-center justify-center">
                  <span className="w-3 h-3 bg-red-600 rounded-full mr-4 animate-ping"></span>
                  DEPLOY CLAW OPS NODE
                </span>
              </a>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-neutral-500 uppercase tracking-[0.2em]">
                  Run manually on your VPS:
                </p>
                <div className="bg-black p-6 border-2 border-white text-left overflow-x-auto relative group">
                  <div className="absolute top-0 left-0 w-2 h-full bg-red-600"></div>
                  <code className="text-white font-mono text-sm whitespace-pre pl-4">
                    curl -sL {apiUrl}/setup/install.sh | bash -s -- "{jwtToken}"
                  </code>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 border-2 border-red-600 text-red-600 font-bold uppercase tracking-[0.2em] text-sm">
            Error: No provision token
          </div>
        )}

        <div className="mt-16">
          <Link href="/" className="text-neutral-500 hover:text-white text-xs font-bold tracking-[0.2em] uppercase transition-colors">
            [ Return to Gallery ]
          </Link>
        </div>
      </div>
    </div>
  );
}
