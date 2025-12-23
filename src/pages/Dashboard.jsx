import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatNumber, formatCurrency } from '@/utils';
import {
  Users,
  Building2,
  Database,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Server,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [statsData, healthData] = await Promise.all([
        api.getSystemStats().catch(() => null),
        api.getSystemHealth().catch(() => null),
      ]);
      setStats(statsData);
      setHealth(healthData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.total_users || 0,
      change: stats?.user_growth || '+0%',
      trend: 'up',
      icon: Users,
      color: 'text-blue-500',
    },
    {
      title: 'Active Tenants',
      value: stats?.total_tenants || 0,
      change: stats?.tenant_growth || '+0%',
      trend: 'up',
      icon: Building2,
      color: 'text-green-500',
    },
    {
      title: 'Total Memories',
      value: formatNumber(stats?.total_memories || 0),
      change: stats?.memory_growth || '+0%',
      trend: 'up',
      icon: Database,
      color: 'text-purple-500',
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(stats?.mrr || 0),
      change: stats?.revenue_growth || '+0%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-yellow-500',
    },
  ];

  const healthChecks = [
    { name: 'API Server', status: health?.api || 'unknown' },
    { name: 'FalkorDB', status: health?.falkordb || 'unknown' },
    { name: 'Redis', status: health?.redis || 'unknown' },
    { name: 'MongoDB', status: health?.mongodb || 'unknown' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">System overview and key metrics</p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-1 mt-1">
                {stat.trend === 'up' ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.change}
                </span>
                <span className="text-sm text-muted-foreground">vs last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Health & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              System Health
            </CardTitle>
            <CardDescription>Infrastructure status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {healthChecks.map((check) => (
                <div key={check.name} className="flex items-center justify-between">
                  <span className="text-sm">{check.name}</span>
                  <Badge
                    variant={check.status === 'healthy' ? 'success' : check.status === 'degraded' ? 'warning' : 'secondary'}
                  >
                    {check.status === 'healthy' && <CheckCircle className="w-3 h-3 mr-1" />}
                    {check.status === 'degraded' && <AlertCircle className="w-3 h-3 mr-1" />}
                    {check.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Quick Stats
            </CardTitle>
            <CardDescription>Platform metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Sessions</span>
                <span className="font-medium">{stats?.active_sessions || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">API Requests (24h)</span>
                <span className="font-medium">{formatNumber(stats?.api_requests_24h || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg Response Time</span>
                <span className="font-medium">{stats?.avg_response_time || 0}ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Error Rate</span>
                <span className="font-medium">{stats?.error_rate || 0}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Storage Used</span>
                <span className="font-medium">{stats?.storage_used || '0 GB'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Breakdown</CardTitle>
          <CardDescription>Users by subscription tier</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { tier: 'Free', count: stats?.subscriptions?.free || 0, color: 'bg-gray-500' },
              { tier: 'Starter', count: stats?.subscriptions?.starter || 0, color: 'bg-blue-500' },
              { tier: 'Team', count: stats?.subscriptions?.team || 0, color: 'bg-purple-500' },
              { tier: 'Enterprise', count: stats?.subscriptions?.enterprise || 0, color: 'bg-yellow-500' },
            ].map((sub) => (
              <div key={sub.tier} className="text-center p-4 rounded-lg bg-muted/50">
                <div className={`w-3 h-3 rounded-full ${sub.color} mx-auto mb-2`} />
                <div className="text-2xl font-bold">{sub.count}</div>
                <div className="text-sm text-muted-foreground">{sub.tier}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
