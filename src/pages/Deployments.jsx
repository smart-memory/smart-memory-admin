import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatDateTime } from '@/utils';
import {
  Rocket,
  GitBranch,
  Package,
  PlayCircle,
  XCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  RotateCcw,
  Terminal,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

const SERVICES = [
  { id: 'smart-memory-service', name: 'SmartMemory Service', color: 'bg-blue-500' },
  { id: 'smart-memory-web', name: 'Web App', color: 'bg-purple-500' },
  { id: 'smart-memory-admin', name: 'Admin Dashboard', color: 'bg-yellow-500' },
  { id: 'maya', name: 'Maya', color: 'bg-green-500' },
  { id: 'smart-memory-insights', name: 'Insights', color: 'bg-pink-500' },
];

const ENVIRONMENTS = ['production', 'staging', 'development'];

export default function Deployments() {
  const [deployments, setDeployments] = useState([]);
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalDeployments, setTotalDeployments] = useState(0);
  const [selectedDeployment, setSelectedDeployment] = useState(null);
  const [showDeployDialog, setShowDeployDialog] = useState(false);
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [deploymentLogs, setDeploymentLogs] = useState('');
  const [deployForm, setDeployForm] = useState({ service: '', environment: 'production', branch: 'main' });
  const limit = 20;

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [page]);

  async function loadData() {
    setLoading(true);
    try {
      const [deploymentsData, buildsData] = await Promise.all([
        api.listDeployments(limit, page * limit).catch(() => ({ deployments: [], total: 0 })),
        api.listBuilds(10, 0).catch(() => ({ builds: [] })),
      ]);
      setDeployments(deploymentsData.deployments || []);
      setTotalDeployments(deploymentsData.total || 0);
      setBuilds(buildsData.builds || []);
    } catch (err) {
      toast.error('Failed to load deployments: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeploy() {
    if (!deployForm.service || !deployForm.environment) {
      toast.error('Please select service and environment');
      return;
    }

    try {
      await api.triggerDeployment(deployForm.service, deployForm.environment, {
        branch: deployForm.branch,
      });
      toast.success('Deployment triggered successfully');
      setShowDeployDialog(false);
      setDeployForm({ service: '', environment: 'production', branch: 'main' });
      loadData();
    } catch (err) {
      toast.error('Failed to trigger deployment: ' + err.message);
    }
  }

  async function handleRollback(deploymentId) {
    if (!confirm('Are you sure you want to rollback this deployment?')) return;

    try {
      await api.rollbackDeployment(deploymentId);
      toast.success('Rollback initiated');
      loadData();
    } catch (err) {
      toast.error('Failed to rollback: ' + err.message);
    }
  }

  async function handleTriggerBuild(service, branch = 'main') {
    try {
      await api.triggerBuild(service, branch);
      toast.success('Build triggered successfully');
      loadData();
    } catch (err) {
      toast.error('Failed to trigger build: ' + err.message);
    }
  }

  async function handleCancelBuild(buildId) {
    try {
      await api.cancelBuild(buildId);
      toast.success('Build cancelled');
      loadData();
    } catch (err) {
      toast.error('Failed to cancel build: ' + err.message);
    }
  }

  async function viewDeploymentLogs(deployment) {
    setSelectedDeployment(deployment);
    setShowLogsDialog(true);
    try {
      const logs = await api.getDeploymentLogs(deployment.id);
      setDeploymentLogs(logs.logs || 'No logs available');
    } catch (err) {
      setDeploymentLogs('Failed to load logs: ' + err.message);
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      success: { variant: 'success', icon: CheckCircle, text: 'Success' },
      running: { variant: 'default', icon: Clock, text: 'Running' },
      pending: { variant: 'secondary', icon: Clock, text: 'Pending' },
      failed: { variant: 'destructive', icon: XCircle, text: 'Failed' },
      cancelled: { variant: 'secondary', icon: XCircle, text: 'Cancelled' },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const totalPages = Math.ceil(totalDeployments / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Deployments</h1>
          <p className="text-muted-foreground">Manage builds and deployments across all services</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowDeployDialog(true)} size="sm">
            <Rocket className="w-4 h-4 mr-2" />
            New Deployment
          </Button>
        </div>
      </div>

      <Tabs defaultValue="deployments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
          <TabsTrigger value="builds">Builds</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        <TabsContent value="deployments">
          <Card>
            <CardHeader>
              <CardTitle>Recent Deployments</CardTitle>
              <CardDescription>{totalDeployments} total deployments</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Environment</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Deployed By</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : deployments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No deployments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    deployments.map((deployment) => (
                      <TableRow key={deployment.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${SERVICES.find(s => s.id === deployment.service)?.color || 'bg-gray-500'}`} />
                            <span className="font-medium">{deployment.service}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{deployment.environment}</Badge>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            {deployment.version || deployment.commit_sha?.slice(0, 7) || 'N/A'}
                          </code>
                        </TableCell>
                        <TableCell>{getStatusBadge(deployment.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {deployment.deployed_by || 'System'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {deployment.created_at ? formatDateTime(deployment.created_at) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => viewDeploymentLogs(deployment)}
                            >
                              <Terminal className="w-4 h-4" />
                            </Button>
                            {deployment.status === 'success' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRollback(deployment.id)}
                              >
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => p - 1)}
                      disabled={page === 0}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= totalPages - 1}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="builds">
          <Card>
            <CardHeader>
              <CardTitle>Recent Builds</CardTitle>
              <CardDescription>Latest build status across all services</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Commit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {builds.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No builds found
                      </TableCell>
                    </TableRow>
                  ) : (
                    builds.map((build) => (
                      <TableRow key={build.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{build.service}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <GitBranch className="w-3 h-3 text-muted-foreground" />
                            <code className="text-xs">{build.branch || 'main'}</code>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            {build.commit_sha?.slice(0, 7) || 'N/A'}
                          </code>
                        </TableCell>
                        <TableCell>{getStatusBadge(build.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {build.duration ? `${build.duration}s` : '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {build.started_at ? formatDateTime(build.started_at) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {build.status === 'running' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCancelBuild(build.id)}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SERVICES.map((service) => {
              const latestDeployment = deployments.find(d => d.service === service.id);
              const latestBuild = builds.find(b => b.service === service.id);

              return (
                <Card key={service.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${service.color}`} />
                        <CardTitle className="text-lg">{service.name}</CardTitle>
                      </div>
                      {latestDeployment && getStatusBadge(latestDeployment.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Latest Deployment</div>
                      {latestDeployment ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>Environment:</span>
                            <Badge variant="outline">{latestDeployment.environment}</Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span>Version:</span>
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {latestDeployment.version || 'N/A'}
                            </code>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {latestDeployment.created_at ? formatDateTime(latestDeployment.created_at) : 'N/A'}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No deployments</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleTriggerBuild(service.id)}
                      >
                        <Package className="w-4 h-4 mr-2" />
                        Build
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setDeployForm({ ...deployForm, service: service.id });
                          setShowDeployDialog(true);
                        }}
                      >
                        <Rocket className="w-4 h-4 mr-2" />
                        Deploy
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Deploy Dialog */}
      <Dialog open={showDeployDialog} onOpenChange={setShowDeployDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Deployment</DialogTitle>
            <DialogDescription>Deploy a service to an environment</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Service</label>
              <Select value={deployForm.service} onValueChange={(v) => setDeployForm({ ...deployForm, service: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICES.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Environment</label>
              <Select value={deployForm.environment} onValueChange={(v) => setDeployForm({ ...deployForm, environment: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENVIRONMENTS.map((env) => (
                    <SelectItem key={env} value={env}>
                      {env}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Branch</label>
              <Select value={deployForm.branch} onValueChange={(v) => setDeployForm({ ...deployForm, branch: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">main</SelectItem>
                  <SelectItem value="develop">develop</SelectItem>
                  <SelectItem value="staging">staging</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeployDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleDeploy}>
              <Rocket className="w-4 h-4 mr-2" />
              Deploy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logs Dialog */}
      <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Deployment Logs</DialogTitle>
            <DialogDescription>
              {selectedDeployment?.service} - {selectedDeployment?.environment}
            </DialogDescription>
          </DialogHeader>
          <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-xs max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap">{deploymentLogs}</pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
