import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, ToggleLeft, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function FeatureFlags() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadFlags(); }, []);

  async function loadFlags() {
    setLoading(true);
    try {
      const data = await api.getFeatureFlags();
      setFlags(data.flags || []);
    } catch (err) {
      toast.error('Failed to load feature flags: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleFlag(flagName, enabled) {
    try {
      await api.updateFeatureFlag(flagName, enabled);
      toast.success(`Flag "${flagName}" ${enabled ? 'enabled' : 'disabled'}`);
      loadFlags();
    } catch (err) {
      toast.error('Failed to update flag: ' + err.message);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Feature Flags</h1>
          <p className="text-muted-foreground">Control feature rollouts across the platform</p>
        </div>
        <Button onClick={loadFlags} variant="outline" size="sm"><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ToggleLeft className="w-5 h-5" />Feature Flags</CardTitle>
          <CardDescription>Toggle features on or off for all users or specific tenants</CardDescription>
        </CardHeader>
        <CardContent>
          {flags.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Info className="w-8 h-8 mx-auto mb-2" />
              <p>No feature flags configured</p>
            </div>
          ) : (
            <div className="space-y-4">
              {flags.map((flag) => (
                <div key={flag.name} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{flag.name}</span>
                      {flag.tenant_ids?.length > 0 && <Badge variant="outline">{flag.tenant_ids.length} tenants</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{flag.description || 'No description'}</p>
                  </div>
                  <Switch checked={flag.enabled} onCheckedChange={(checked) => toggleFlag(flag.name, checked)} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
