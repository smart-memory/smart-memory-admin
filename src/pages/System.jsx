import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatBytes, formatNumber, formatDateTime } from '@/utils';
import {
  Server,
  Database,
  HardDrive,
  Cpu,
  Activity,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  XCircle,
  Play,
  Trash2,
  Bell,
  TrendingUp,
  Clock,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

export default function System() {
  const [health, setHealth] = useState(null);
  const [dbStats, setDbStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [uptime, setUptime] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [metricsRange, setMetricsRange] = useState('1h');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [metricsRange]);

  async function loadData() {
    setLoading(true);
    try {
      const [healthData, dbData, alertsData, uptimeData] = await Promise.all([
        api.getSystemHealth().catch(() => null),
        api.getDatabaseStats().catch(() => null),
        api.getAlerts(null, 10).catch(() => ({ alerts: [] })),
        api.getUptime().catch(() => null),
      ]);
      setHealth(healthData);
      setDbStats(dbData);
      setAlerts(alertsData.alerts || []);
      setUptime(uptimeData);
    } catch (err) {
      toast.error('Failed to load system data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadMetrics() {
    try {
      const metricsData = await api.getSystemMetrics(metricsRange);
      setMetrics(metricsData);
    } catch (err) {
      console.error('Failed to load metrics:', err);
    }
  }

  async function runMaintenance(operation) {
    setMaintenanceLoading(true);
    try {
      await api.runDatabaseMaintenance(operation);
      toast.success(`${operation} completed successfully`);
      loadData();
    } catch (err) {
      toast.error(`Failed to run ${operation}: ` + err.message);
    } finally {
      setMaintenanceLoading(false);
    }
  }

  async function handleAcknowledgeAlert(alertId) {
    try {
      await api.acknowledgeAlert(alertId);
      toast.success('Alert acknowledged');
      loadData();
    } catch (err) {
      toast.error('Failed to acknowledge alert: ' + err.message);
    }
  }

  async function handleResolveAlert(alertId) {
    try {
      await api.resolveAlert(alertId);
      toast.success('Alert resolved');
      loadData();
    } catch (err) {
      toast.error('Failed to resolve alert: ' + err.message);
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="success">Healthy</Badge>;
      case 'degraded':
        return <Badge variant="warning">Degraded</Badge>;
      case 'unhealthy':
        return <Badge variant="destructive">Unhealthy</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getSeverityBadge = (severity) => {
    const variants = {
      critical: 'destructive',
      warning: 'warning',
      info: 'secondary',
    };
    return <Badge variant={variants[severity] || 'secondary'}>{severity}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const services = [
    { name: 'API Server', status: health?.api || 'unknown', latency: health?.api_latency || 0 },
    { name: 'FalkorDB (Graph)', status: health?.falkordb || 'unknown', latency: health?.falkordb_latency || 0 },
    { name: 'Redis (Cache)', status: health?.redis || 'unknown', latency: health?.redis_latency || 0 },
    { name: 'MongoDB (Auth)', status: health?.mongodb || 'unknown', latency: health?.mongodb_latency || 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System</h1>
          <p className="text-muted-foreground">Infrastructure health and database management</p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                System Status
              </CardTitle>
              <CardDescription>Overall infrastructure health</CardDescription>
            </div>
            {getStatusBadge(health?.overall || 'unknown')}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {services.map((service) => (
              <div key={service.name} className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{service.name}</span>
                  {getStatusIcon(service.status)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Latency: {service.latency}ms
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="database" className="space-y-4">
        <TabsList>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="database">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  FalkorDB Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Nodes</span>
                    <span className="font-medium">{formatNumber(dbStats?.falkordb?.nodes || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Edges</span>
                    <span className="font-medium">{formatNumber(dbStats?.falkordb?.edges || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Memory Usage</span>
                    <span className="font-medium">{formatBytes(dbStats?.falkordb?.memory || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Graphs</span>
                    <span className="font-medium">{dbStats?.falkordb?.graphs || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  MongoDB Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Collections</span>
                    <span className="font-medium">{dbStats?.mongodb?.collections || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Documents</span>
                    <span className="font-medium">{formatNumber(dbStats?.mongodb?.documents || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Data Size</span>
                    <span className="font-medium">{formatBytes(dbStats?.mongodb?.data_size || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Index Size</span>
                    <span className="font-medium">{formatBytes(dbStats?.mongodb?.index_size || 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Redis Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Keys</span>
                    <span className="font-medium">{formatNumber(dbStats?.redis?.keys || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Memory Usage</span>
                    <span className="font-medium">{formatBytes(dbStats?.redis?.memory || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Connected Clients</span>
                    <span className="font-medium">{dbStats?.redis?.clients || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Hit Rate</span>
                    <span className="font-medium">{dbStats?.redis?.hit_rate || 0}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="resources">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="w-5 h-5" />
                  CPU Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{health?.cpu_usage || 0}%</div>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ width: `${health?.cpu_usage || 0}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Memory Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{health?.memory_usage || 0}%</div>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ width: `${health?.memory_usage || 0}%` }}
                  />
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  {formatBytes(health?.memory_used || 0)} / {formatBytes(health?.memory_total || 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="w-5 h-5" />
                  Disk Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{health?.disk_usage || 0}%</div>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ width: `${health?.disk_usage || 0}%` }}
                  />
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  {formatBytes(health?.disk_used || 0)} / {formatBytes(health?.disk_total || 0)}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monitoring">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">System Metrics</h3>
              <Select value={metricsRange} onValueChange={setMetricsRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="6h">Last 6 Hours</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Uptime</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-green-500" />
                    <div className="text-2xl font-bold">{uptime?.uptime_percentage || 99.9}%</div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {uptime?.uptime_days || 0} days
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Avg Response Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-500" />
                    <div className="text-2xl font-bold">{metrics?.avg_response_time || 0}ms</div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last {metricsRange}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Request Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                    <div className="text-2xl font-bold">{formatNumber(metrics?.requests_per_second || 0)}</div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    req/sec
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Error Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <div className="text-2xl font-bold">{metrics?.error_rate || 0}%</div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last {metricsRange}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Service Uptime</CardTitle>
                <CardDescription>Availability over the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {services.map((service) => (
                    <div key={service.name}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{service.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {uptime?.[service.name.toLowerCase().replace(/\s+/g, '_')]?.uptime || 99.9}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 transition-all"
                          style={{ width: `${uptime?.[service.name.toLowerCase().replace(/\s+/g, '_')]?.uptime || 99.9}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Active Alerts
                  </CardTitle>
                  <CardDescription>{alerts.length} alerts require attention</CardDescription>
                </div>
                <Button onClick={loadData} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-2" />
                  <p className="text-muted-foreground">No active alerts</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getSeverityBadge(alert.severity)}
                            <span className="font-medium">{alert.title}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{alert.message}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Service: {alert.service || 'System'}</span>
                            <span>•</span>
                            <span>{alert.created_at ? formatDateTime(alert.created_at) : 'N/A'}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          {!alert.acknowledged && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAcknowledgeAlert(alert.id)}
                            >
                              Acknowledge
                            </Button>
                          )}
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleResolveAlert(alert.id)}
                          >
                            Resolve
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Database Maintenance</CardTitle>
              <CardDescription>Run maintenance operations on the database</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Clear Cache</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Clear Redis cache to free memory and force fresh data fetches.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => runMaintenance('clear_cache')}
                    disabled={maintenanceLoading}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Cache
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Rebuild Indexes</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Rebuild database indexes for improved query performance.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => runMaintenance('rebuild_indexes')}
                    disabled={maintenanceLoading}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Rebuild
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Vacuum Database</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Reclaim storage space and optimize database files.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => runMaintenance('vacuum')}
                    disabled={maintenanceLoading}
                  >
                    <HardDrive className="w-4 h-4 mr-2" />
                    Vacuum
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
