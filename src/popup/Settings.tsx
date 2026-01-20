import { useState, useEffect } from 'react';
import { Save, ChevronLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

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

        // Normalize Base URL
        let endpoint = url.trim() || 'https://api.openai.com/v1';
        if (endpoint.endsWith('/')) endpoint = endpoint.slice(0, -1);
        if (!endpoint.endsWith('/v1')) endpoint += '/v1';

        // Construct full URL for models endpoint
        // Some proxies might not support /models, but it's standard.
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
            <div className="flex items-center gap-2 mb-6 cursor-pointer text-gray-500 hover:text-blue-600 transition-colors" onClick={onBack}>
                <ChevronLeft size={20} />
                <span className="font-medium">Back</span>
            </div>

            <h2 className="text-xl font-bold text-gray-800 mb-6">Settings</h2>

            <div className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">API Token</label>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk-..."
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                    />
                    <p className="text-xs text-gray-400 mt-1">OpenAI API Key required.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Base URL <span className="text-gray-400 font-normal">(Optional)</span></label>
                    <input
                        type="text"
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        placeholder="https://api.openai.com/v1"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                    />
                    <p className="text-xs text-gray-400 mt-1">Default: https://api.openai.com/v1</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                    <select
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                    >
                        <option value="gpt-4o">GPT-4o (Recommended)</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    </select>
                </div>

                <button
                    onClick={handleSave}
                    disabled={status.type === 'loading'}
                    className={`w-full py-2 rounded-lg font-medium shadow-md transition-all flex items-center justify-center gap-2 text-white
            ${status.type === 'loading' ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}
          `}
                >
                    {status.type === 'loading' ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {status.type === 'loading' ? 'Verifying...' : 'Save Configuration'}
                </button>

                {status.msg && (
                    <div className={`text-center text-sm font-medium animate-fade-in flex items-center justify-center gap-1.5 p-2 rounded-lg
            ${status.type === 'success' ? 'bg-green-50 text-green-700' : ''}
            ${status.type === 'error' ? 'bg-red-50 text-red-700' : ''}
          `}>
                        {status.type === 'success' && <CheckCircle size={14} />}
                        {status.type === 'error' && <AlertCircle size={14} />}
                        {status.msg}
                    </div>
                )}
            </div>
        </div>
    );
}
