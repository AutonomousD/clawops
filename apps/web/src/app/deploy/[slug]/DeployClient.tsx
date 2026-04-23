'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeployClient({ 
  packageSlug, 
  requiredInputs 
}: { 
  packageSlug: string;
  requiredInputs: string[];
}) {
  const router = useRouter();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [jwt, setJwt] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.0.18:3000';
      const response = await fetch(`${apiUrl}/api/provision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package_slug: packageSlug,
          user_inputs: formData
        })
      });

      if (!response.ok) {
        throw new Error('Provisioning failed. Ensure the provisioner API is running on port 3000.');
      }

      const data = await response.json();
      router.push(`/success?jwt=${encodeURIComponent(data.token)}&slug=${encodeURIComponent(packageSlug)}`);
    } catch (err: any) {
      console.error('Deployment Fetch Error:', err);
      alert(`Deployment Fetch Error: ${err.message || err.toString()}`);
      setErrorMessage(err.message || 'An unknown error occurred.');
      setStatus('error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {requiredInputs.map((input) => (
        <div key={input}>
          <label className="block text-sm font-medium text-neutral-300 mb-2 capitalize">
            {input.replace(/_/g, ' ')}
          </label>
          <input
            type={input.includes('pdf') || input.includes('url') || input.includes('links') ? 'url' : 'text'}
            required
            placeholder={input.includes('pdf') ? 'e.g. https://drive.google.com/...' : `Enter ${input.replace(/_/g, ' ')}`}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder:text-neutral-600"
            value={formData[input] || ''}
            onChange={(e) => handleInputChange(input, e.target.value)}
          />
        </div>
      ))}

      {status === 'error' && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full inline-flex justify-center items-center py-4 px-4 rounded-xl text-md font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === 'loading' ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating Payload...
          </span>
        ) : 'Generate Provisioning Command'}
      </button>
    </form>
  );
}
