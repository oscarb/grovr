import { useState, useEffect } from 'react';
import { ExternalLink, Check, Loader2, Plus } from 'lucide-react';
import * as api from '@/lib/api';
import type { LinearConfig, LinearConfigMeta } from '@/lib/api';

export function LinearSettings() {
  const [config, setConfig] = useState<LinearConfigMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; message: string } | null>(null);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [token, setToken] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const result = await api.getLinearConfig();
      setConfig(result);
    } catch (err) {
      console.error('Failed to load Linear config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (!token.trim()) return;
    setError('');
    setTestResult(null);
    setTesting(true);

    try {
      const result = await api.validateLinearToken(token.trim());
      if (result.valid) {
        setTestResult({ valid: true, message: `Connected as ${result.username}` });
      } else {
        setTestResult({ valid: false, message: result.error || 'Invalid API token' });
      }
    } catch (err) {
      setTestResult({ valid: false, message: err instanceof Error ? err.message : String(err) });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!token.trim()) return;
    setError('');
    setSaving(true);

    try {
      let displayName = '';
      let email = '';

      // Validate token first if not already successfully tested
      if (testResult?.valid && testResult.message.includes('Connected as')) {
        const username = testResult.message.replace('Connected as ', '');
        const match = username.match(/^(.*)\s\((.*)\)$/);
        if (match) {
          displayName = match[1];
          email = match[2];
        } else {
          email = username;
          displayName = username;
        }
      } else {
        const result = await api.validateLinearToken(token.trim());
        if (!result.valid) {
          setError(result.error || 'Invalid API token');
          setSaving(false);
          return;
        }
        if (result.username) {
          const match = result.username.match(/^(.*)\s\((.*)\)$/);
          if (match) {
            displayName = match[1];
            email = match[2];
          } else {
            email = result.username;
            displayName = result.username;
          }
        }
      }

      if (!email) {
        setError('Could not retrieve email from Linear account');
        setSaving(false);
        return;
      }

      const newConfig: LinearConfig = {
        email,
        token: token.trim(),
        display_name: displayName || undefined,
      };

      await api.setLinearConfig(newConfig);
      setConfig({ email, display_name: displayName || undefined, has_token: true });
      setShowForm(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    try {
      await api.removeLinearConfig();
      setConfig(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const resetForm = () => {
    setToken('');
    setError('');
    setTestResult(null);
  };

  if (loading) {
    return (
      <div className="settings-section">
        <div className="settings-group first">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Loader2 size={12} className="animate-spin" />
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-section">
      <div className="settings-group first">
        <h4 className="settings-group-title">Linear Integration</h4>
        <p className="settings-group-description">
          Configure a Linear Personal API key to fetch issue details.
        </p>

        {config && !showForm ? (
          <div className="integration-card">
            <div className="integration-info flex-1 min-w-0">
              <span className="integration-name">
                {config.display_name || config.email}
              </span>
              <span className="integration-token">
                {config.email}
              </span>
            </div>
            <div className="integration-status connected">
              <Check size={10} />
              Connected
            </div>
            <button
              className="btn-secondary-sm btn-danger-text"
              onClick={handleRemove}
            >
              Remove
            </button>
          </div>
        ) : (showForm || !config) ? (
          <div className="space-y-3">
            <div className="settings-item-full">
              <label className="settings-label">Personal API Key</label>
              <input
                type="password"
                className="settings-input font-mono"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="lin_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
              <div className="flex justify-end mt-1">
                <a
                  href="https://linear.app/settings/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="integration-help-link"
                >
                  Create Linear API Key
                  <ExternalLink size={10} />
                </a>
              </div>
            </div>

            {testResult && (
              <div className={`text-xs ${testResult.valid ? 'text-green-500' : 'text-red-500'}`}>
                {testResult.message}
              </div>
            )}

            {error && <div className="text-xs text-red-500">{error}</div>}

            <div className="flex gap-2">
              {config && (
                <button
                  type="button"
                  className="btn-secondary-sm"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                className="btn-secondary-sm"
                onClick={handleTest}
                disabled={!token.trim() || testing}
              >
                {testing ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test'
                )}
              </button>
              <button
                type="button"
                className="btn-primary-sm"
                onClick={handleSave}
                disabled={!token.trim() || saving}
              >
                {saving ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="btn-secondary-sm"
            onClick={() => setShowForm(true)}
          >
            <Plus size={12} />
            Add Connection
          </button>
        )}
      </div>
    </div>
  );
}
