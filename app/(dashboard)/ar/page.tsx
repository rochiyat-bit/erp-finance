"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";

interface DashboardStats {
  totalCustomers: number;
  activeCustomers: number;
  totalReceivables: number;
  currentReceivables: number;
  overdueReceivables: number;
  totalInvoices: number;
  unpaidInvoices: number;
  overdueInvoices: number;
  totalPayments: number;
  paymentsThisMonth: number;
  averageDaysToPay: number;
}

export default function ARDashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    activeCustomers: 0,
    totalReceivables: 0,
    currentReceivables: 0,
    overdueReceivables: 0,
    totalInvoices: 0,
    unpaidInvoices: 0,
    overdueInvoices: 0,
    totalPayments: 0,
    paymentsThisMonth: 0,
    averageDaysToPay: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      // Fetch customers
      const customersRes = await fetch("/api/ar/customers?limit=1000");
      const customersData = await customersRes.json();

      // Fetch invoices
      const invoicesRes = await fetch("/api/ar/invoices?limit=1000");
      const invoicesData = await invoicesRes.json();

      // Fetch payments
      const paymentsRes = await fetch("/api/ar/payments?limit=1000");
      const paymentsData = await paymentsRes.json();

      if (customersData.success && invoicesData.success && paymentsData.success) {
        const customers = customersData.customers;
        const invoices = invoicesData.invoices;
        const payments = paymentsData.payments;

        // Calculate customer stats
        const totalCustomers = customers.length;
        const activeCustomers = customers.filter((c: any) => c.status === "active").length;

        // Calculate invoice stats
        const totalInvoices = invoices.length;
        const unpaidInvoices = invoices.filter((i: any) => i.paymentStatus !== "paid").length;
        const overdueInvoices = invoices.filter((i: any) => i.isOverdue).length;

        // Calculate receivables
        const totalReceivables = invoices.reduce(
          (sum: number, i: any) => sum + Number(i.balanceAmount),
          0
        );
        const currentReceivables = invoices.filter((i: any) => !i.isOverdue).reduce(
          (sum: number, i: any) => sum + Number(i.balanceAmount),
          0
        );
        const overdueReceivables = invoices.filter((i: any) => i.isOverdue).reduce(
          (sum: number, i: any) => sum + Number(i.balanceAmount),
          0
        );

        // Calculate payment stats
        const totalPayments = payments.length;
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const paymentsThisMonth = payments.filter(
          (p: any) => new Date(p.paymentDate) >= firstDayOfMonth
        ).length;

        setStats({
          totalCustomers,
          activeCustomers,
          totalReceivables,
          currentReceivables,
          overdueReceivables,
          totalInvoices,
          unpaidInvoices,
          overdueInvoices,
          totalPayments,
          paymentsThisMonth,
          averageDaysToPay: 0, // Would need more complex calculation
        });
      } else {
        toast.error("Failed to fetch dashboard statistics");
      }
    } catch (error) {
      toast.error("An error occurred while fetching dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Accounts Receivable</h1>
        <p className="text-muted-foreground">
          Overview of your receivables and customer accounts
        </p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Loading dashboard...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common AR operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <Link href="/ar/customers/new">
                  <Button variant="outline" className="w-full">
                    Add Customer
                  </Button>
                </Link>
                <Link href="/ar/invoices/new">
                  <Button variant="outline" className="w-full">
                    Create Invoice
                  </Button>
                </Link>
                <Link href="/ar/payments/new">
                  <Button variant="outline" className="w-full">
                    Record Payment
                  </Button>
                </Link>
                <Link href="/ar/customers">
                  <Button variant="outline" className="w-full">
                    View Customers
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Customer Statistics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeCustomers} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Receivables</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalReceivables)}</div>
                <p className="text-xs text-muted-foreground">
                  Outstanding balance
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue Receivables</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(stats.overdueReceivables)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.overdueInvoices} overdue invoices
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Invoice Statistics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalInvoices}</div>
                <p className="text-xs text-muted-foreground">
                  All time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unpaid Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.unpaidInvoices}
                </div>
                <p className="text-xs text-muted-foreground">
                  Awaiting payment
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Receivables</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.currentReceivables)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Not yet due
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Payment Statistics */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPayments}</div>
                <p className="text-xs text-muted-foreground">
                  All time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Payments This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.paymentsThisMonth}</div>
                <p className="text-xs text-muted-foreground">
                  Current month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Links */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Invoices</CardTitle>
                <CardDescription>Latest customer invoices</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/ar/invoices">
                  <Button variant="outline" className="w-full">
                    View All Invoices
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Payments</CardTitle>
                <CardDescription>Latest customer payments</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/ar/payments">
                  <Button variant="outline" className="w-full">
                    View All Payments
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
