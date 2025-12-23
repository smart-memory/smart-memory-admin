import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatDateTime, formatNumber } from '@/utils';
import {
  Search,
  MoreHorizontal,
  Eye,
  Settings,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Database,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

export default function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [tenantStats, setTenantStats] = useState(null);
  const [showTenantDialog, setShowTenantDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const limit = 20;

  useEffect(() => {
    loadTenants();
  }, [page, search]);

  async function loadTenants() {
    setLoading(true);
    try {
      const data = await api.listAllTenants(limit, page * limit, search || null);
      setTenants(data.tenants || []);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error('Failed to load tenants: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function viewTenantDetails(tenant) {
    setSelectedTenant(tenant);
    setShowTenantDialog(true);
    try {
      const stats = await api.getTenantStats(tenant.id);
      setTenantStats(stats);
    } catch (err) {
      console.error('Failed to load tenant stats:', err);
    }
  }

  async function handleDeleteTenant() {
    if (!selectedTenant) return;
    try {
      await api.deleteTenant(selectedTenant.id);
      toast.success('Tenant deleted successfully');
      setShowDeleteDialog(false);
      setSelectedTenant(null);
      loadTenants();
    } catch (err) {
      toast.error('Failed to delete tenant: ' + err.message);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tenants</h1>
          <p className="text-muted-foreground">Manage all workspaces and organizations</p>
        </div>
        <Button onClick={loadTenants} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Tenants</CardTitle>
              <CardDescription>{total} total tenants</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tenants..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Memories</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : tenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No tenants found
                  </TableCell>
                </TableRow>
              ) : (
                tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{tenant.name || 'Unnamed'}</div>
                        <code className="text-xs text-muted-foreground">{tenant.id?.slice(0, 12)}</code>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {tenant.owner_email || tenant.owner_user_id?.slice(0, 8) || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={tenant.subscription_tier === 'free' ? 'secondary' : 'default'}>
                        {tenant.subscription_tier || 'free'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Database className="w-3 h-3 text-muted-foreground" />
                        <span>{formatNumber(tenant.current_memory_count || 0)}</span>
                        <span className="text-muted-foreground">/ {formatNumber(tenant.max_memories || 0)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-muted-foreground" />
                        <span>{tenant.user_count || 1}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {tenant.created_at ? formatDateTime(tenant.created_at) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={tenant.is_active !== false ? 'success' : 'destructive'}>
                        {tenant.is_active !== false ? 'Active' : 'Disabled'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => viewTenantDetails(tenant)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="w-4 h-4 mr-2" />
                            Edit Settings
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedTenant(tenant);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Tenant
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {page * limit + 1} to {Math.min((page + 1) * limit, total)} of {total}
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
                <span className="text-sm">
                  Page {page + 1} of {totalPages}
                </span>
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

      {/* Tenant Details Dialog */}
      <Dialog open={showTenantDialog} onOpenChange={setShowTenantDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tenant Details</DialogTitle>
            <DialogDescription>Full tenant information and statistics</DialogDescription>
          </DialogHeader>
          {selectedTenant && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">ID</label>
                  <p className="font-mono text-sm">{selectedTenant.id}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Name</label>
                  <p>{selectedTenant.name || 'Unnamed'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Owner</label>
                  <p className="font-mono text-sm">{selectedTenant.owner_user_id}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Subscription</label>
                  <p>{selectedTenant.subscription_tier || 'free'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Memory Usage</label>
                  <p>{selectedTenant.current_memory_count || 0} / {selectedTenant.max_memories || 0}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Query Limit</label>
                  <p>{selectedTenant.max_queries_per_day || 0} / day</p>
                </div>
              </div>

              {tenantStats && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Usage Statistics</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{tenantStats.total_memories || 0}</div>
                      <div className="text-sm text-muted-foreground">Memories</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{tenantStats.total_entities || 0}</div>
                      <div className="text-sm text-muted-foreground">Entities</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{tenantStats.queries_today || 0}</div>
                      <div className="text-sm text-muted-foreground">Queries Today</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tenant</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete tenant "{selectedTenant?.name}"? 
              This will permanently delete all associated data including memories, users, and teams.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTenant}>
              Delete Tenant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
