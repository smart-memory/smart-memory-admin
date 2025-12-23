import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDateTime } from '@/utils';
import { Activity as ActivityIcon, RefreshCw, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export default function Activity() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ action: '', user_id: '' });
  const limit = 50;

  useEffect(() => { loadLogs(); }, [page, filters]);

  async function loadLogs() {
    setLoading(true);
    try {
      const data = await api.getActivityLogs(limit, page * limit, filters);
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error('Failed to load activity logs: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Activity</h1>
          <p className="text-muted-foreground">Platform-wide activity logs</p>
        </div>
        <Button onClick={loadLogs} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ActivityIcon className="w-5 h-5" />Activity Logs
              </CardTitle>
              <CardDescription>{total} total events</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="User ID..." value={filters.user_id}
                  onChange={(e) => { setFilters(f => ({ ...f, user_id: e.target.value })); setPage(0); }}
                  className="pl-9" />
              </div>
              <Select value={filters.action} onValueChange={(v) => { setFilters(f => ({ ...f, action: v })); setPage(0); }}>
                <SelectTrigger className="w-40"><SelectValue placeholder="All actions" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="memory_create">Memory Create</SelectItem>
                  <SelectItem value="memory_delete">Memory Delete</SelectItem>
                  <SelectItem value="search">Search</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell></TableRow>
              ) : logs.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No activity logs found</TableCell></TableRow>
              ) : logs.map((log, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm">{log.timestamp ? formatDateTime(log.timestamp) : 'N/A'}</TableCell>
                  <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{log.user_id?.slice(0, 8) || 'N/A'}</code></TableCell>
                  <TableCell><Badge variant="outline">{log.action || 'unknown'}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{log.details || '-'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{log.ip_address || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 0}><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
