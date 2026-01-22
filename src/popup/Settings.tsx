import { useState, useEffect } from 'react';

interface SettingsProps {
    onBack: () => void;
}

export default function Settings({ onBack }: SettingsProps) {
    const [apiKey, setApiKey] = useState('');
    const [model, setModel] = useState('gpt-4o');
    const [baseUrl, setBaseUrl] = useState('');
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'loading' | '', msg: string }>({ type: '', msg: '' });

    useEffect(() => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get(['openaiApiKey', 'openaiModel', 'openaiBaseUrl'], (result) => {
                if (result.openaiApiKey) setApiKey(result.openaiApiKey as string);
                if (result.openaiModel) setModel(result.openaiModel as string);
                if (result.openaiBaseUrl) setBaseUrl(result.openaiBaseUrl as string);
            });
        }
    }, []);

    const verifyKey = async (key: string, url: string) => {
        if (!key) return false;

        let endpoint = url.trim() || 'https://api.openai.com/v1';
        if (endpoint.endsWith('/')) endpoint = endpoint.slice(0, -1);
        if (!endpoint.endsWith('/v1')) endpoint += '/v1';

        const modelsParam = endpoint + '/models';

        try {
            const response = await fetch(modelsParam, {
                headers: {
                    'Authorization': `Bearer ${key}`
                }
            });
            if (!response.ok) {
                throw new Error('Invalid API Key or Endpoint');
            }
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    const handleSave = async () => {
        setStatus({ type: 'loading', msg: 'Verifying...' });

        if (!apiKey) {
            setStatus({ type: 'error', msg: 'API Key is required' });
            return;
        }

        const isValid = await verifyKey(apiKey, baseUrl);

        if (isValid) {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.local.set({
                    openaiApiKey: apiKey,
                    openaiModel: model,
                    openaiBaseUrl: baseUrl
                }, () => {
                    setStatus({ type: 'success', msg: 'Verified & Saved!' });
                });
            } else {
                setStatus({ type: 'success', msg: 'Verified & Saved (Mock)!' });
            }
        } else {
            setStatus({ type: 'error', msg: 'Connection Failed. Check Key/URL.' });
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <button
                    onClick={onBack}
                    className="p-1.5 -ml-1.5 hover:bg-black/5 rounded-full transition-colors"
                >
                    <span className="material-symbols-outlined text-ink/50 text-xl">chevron_left</span>
                </button>
                <h2 className="text-lg font-light tracking-[0.15em] uppercase text-ink">Settings</h2>
            </div>

            <div className="space-y-3 flex-1">
                {/* API Token */}
                <div>
                    <label className="block text-[9px] uppercase kerning-wide font-semibold text-ink/40 mb-1.5">API Token</label>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk-..."
                        className="w-full px-3 py-2.5 bg-paper-white border border-black/5 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all text-sm zen-shadow"
                    />
                </div>

                {/* Base URL */}
                <div>
                    <label className="block text-[9px] uppercase kerning-wide font-semibold text-ink/40 mb-1.5">
                        Base URL <span className="text-ink/20 font-normal normal-case tracking-normal">(Optional)</span>
                    </label>
                    <input
                        type="text"
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        placeholder="https://api.openai.com/v1"
                        className="w-full px-3 py-2.5 bg-paper-white border border-black/5 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all text-sm zen-shadow"
                    />
                </div>

                {/* Model */}
                <div>
                    <label className="block text-[9px] uppercase kerning-wide font-semibold text-ink/40 mb-1.5">Model</label>
                    <select
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="w-full px-3 py-2.5 bg-paper-white border border-black/5 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm zen-shadow"
                    >
                        <option value="gpt-4o">GPT-4o (Recommended)</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    </select>
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={status.type === 'loading'}
                    className="w-full py-2.5 rounded-xl font-medium zen-shadow transition-all flex items-center justify-center gap-2 text-white active:scale-[0.98] hover:opacity-90"
                    style={{
                        backgroundColor: status.type === 'loading' ? 'rgba(16, 185, 129, 0.7)' : '#10b981'
                    }}
                >
                    {status.type === 'loading' ? (
                        <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                    ) : (
                        <span className="material-symbols-outlined text-base">save</span>
                    )}
                    <span className="text-sm">{status.type === 'loading' ? 'Verifying...' : 'Save'}</span>
                </button>

                {/* Status Message */}
                {status.msg && (
                    <div className={`text-center text-xs font-medium flex items-center justify-center gap-1.5 p-2 rounded-lg
                        ${status.type === 'success' ? 'bg-green-50 text-green-700' : ''}
                        ${status.type === 'error' ? 'bg-red-50 text-red-700' : ''}
                    `}>
                        {status.type === 'success' && <span className="material-symbols-outlined text-sm">check_circle</span>}
                        {status.type === 'error' && <span className="material-symbols-outlined text-sm">error</span>}
                        {status.msg}
                    </div>
                )}
            </div>
        </div>
    );
}
