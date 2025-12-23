import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDateTime } from '@/utils';
import {
  DollarSign,
  TrendingUp,
  Users,
  CreditCard,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { toast } from 'sonner';

export default function Billing() {
  const [overview, setOverview] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [subscriptions, setSubscriptions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [overviewData, revenueData, subsData] = await Promise.all([
        api.getBillingOverview().catch(() => null),
        api.getRevenueMetrics('30d').catch(() => null),
        api.getSubscriptionMetrics().catch(() => null),
      ]);
      setOverview(overviewData);
      setRevenue(revenueData);
      setSubscriptions(subsData);
    } catch (err) {
      toast.error('Failed to load billing data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stats = [
    {
      title: 'Monthly Recurring Revenue',
      value: formatCurrency(overview?.mrr || 0),
      change: overview?.mrr_growth || '+0%',
      trend: 'up',
      icon: DollarSign,
    },
    {
      title: 'Annual Recurring Revenue',
      value: formatCurrency(overview?.arr || 0),
      change: overview?.arr_growth || '+0%',
      trend: 'up',
      icon: TrendingUp,
    },
    {
      title: 'Paying Customers',
      value: overview?.paying_customers || 0,
      change: overview?.customer_growth || '+0%',
      trend: 'up',
      icon: Users,
    },
    {
      title: 'Average Revenue Per User',
      value: formatCurrency(overview?.arpu || 0),
      change: overview?.arpu_growth || '+0%',
      trend: 'up',
      icon: CreditCard,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing</h1>
          <p className="text-muted-foreground">Revenue and subscription metrics</p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="w-5 h-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-1 mt-1">
                {stat.trend === 'up' ? (
                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.change}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="subscriptions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
          <TabsTrigger value="churn">Churn Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Distribution</CardTitle>
              <CardDescription>Breakdown by tier</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { tier: 'Free', count: subscriptions?.free || 0, revenue: 0, color: 'bg-gray-500' },
                  { tier: 'Starter', count: subscriptions?.starter || 0, revenue: subscriptions?.starter_revenue || 0, color: 'bg-blue-500' },
                  { tier: 'Team', count: subscriptions?.team || 0, revenue: subscriptions?.team_revenue || 0, color: 'bg-purple-500' },
                  { tier: 'Enterprise', count: subscriptions?.enterprise || 0, revenue: subscriptions?.enterprise_revenue || 0, color: 'bg-yellow-500' },
                ].map((sub) => (
                  <div key={sub.tier} className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${sub.color}`} />
                      <span className="font-medium">{sub.tier}</span>
                    </div>
                    <div className="text-2xl font-bold">{sub.count}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(sub.revenue)} / month
                    </div>
                  </div>
                ))}
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tier</TableHead>
                    <TableHead>Subscribers</TableHead>
                    <TableHead>Monthly Revenue</TableHead>
                    <TableHead>% of Total</TableHead>
                    <TableHead>Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { tier: 'Starter', price: 9.99 },
                    { tier: 'Team', price: 29.99 },
                    { tier: 'Enterprise', price: 99.99 },
                  ].map((tier) => {
                    const count = subscriptions?.[tier.tier.toLowerCase()] || 0;
                    const revenue = count * tier.price;
                    const totalRevenue = overview?.mrr || 1;
                    const percentage = ((revenue / totalRevenue) * 100).toFixed(1);
                    
                    return (
                      <TableRow key={tier.tier}>
                        <TableCell>
                          <Badge>{tier.tier}</Badge>
                        </TableCell>
                        <TableCell>{count}</TableCell>
                        <TableCell>{formatCurrency(revenue)}</TableCell>
                        <TableCell>{percentage}%</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-green-500">
                            <ArrowUpRight className="w-4 h-4" />
                            <span className="text-sm">+5%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(revenue?.transactions || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    (revenue?.transactions || []).map((tx, i) => (
                      <TableRow key={i}>
                        <TableCell>{formatDateTime(tx.date)}</TableCell>
                        <TableCell>{tx.customer_email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{tx.type}</Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(tx.amount)}</TableCell>
                        <TableCell>
                          <Badge variant={tx.status === 'succeeded' ? 'success' : 'destructive'}>
                            {tx.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="churn">
          <Card>
            <CardHeader>
              <CardTitle>Churn Analysis</CardTitle>
              <CardDescription>Customer retention metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <div className="text-3xl font-bold text-green-500">
                    {overview?.retention_rate || 95}%
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Retention Rate</div>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <div className="text-3xl font-bold text-red-500">
                    {overview?.churn_rate || 5}%
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Monthly Churn</div>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <div className="text-3xl font-bold">
                    {overview?.churned_this_month || 0}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Churned This Month</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
