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

export default function APDashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    totalVendors: 0,
    activeVendors: 0,
    totalBills: 0,
    unpaidBills: 0,
    overdueBills: 0,
    totalPayable: 0,
    overdueAmount: 0,
    paymentsThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch vendors
      const vendorsRes = await fetch("/api/ap/vendors");
      const vendorsData = await vendorsRes.json();

      // Fetch bills
      const billsRes = await fetch("/api/ap/bills");
      const billsData = await billsRes.json();

      // Fetch payments
      const paymentsRes = await fetch("/api/ap/payments");
      const paymentsData = await paymentsRes.json();

      if (vendorsData.success && billsData.success && paymentsData.success) {
        const vendors = vendorsData.vendors || [];
        const bills = billsData.bills || [];
        const payments = paymentsData.payments || [];

        const activeVendors = vendors.filter((v: any) => v.status === "active");
        const unpaidBills = bills.filter((b: any) =>
          b.status !== "paid" && b.status !== "cancelled"
        );
        const overdueBills = bills.filter((b: any) =>
          new Date(b.dueDate) < new Date() &&
          b.status !== "paid" &&
          b.status !== "cancelled"
        );

        const totalPayable = unpaidBills.reduce(
          (sum: number, b: any) => sum + Number(b.outstandingAmount || 0),
          0
        );

        const overdueAmount = overdueBills.reduce(
          (sum: number, b: any) => sum + Number(b.outstandingAmount || 0),
          0
        );

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const paymentsThisMonth = payments.filter((p: any) =>
          new Date(p.paymentDate) >= startOfMonth && p.status === "posted"
        ).length;

        setStats({
          totalVendors: vendors.length,
          activeVendors: activeVendors.length,
          totalBills: bills.length,
          unpaidBills: unpaidBills.length,
          overdueBills: overdueBills.length,
          totalPayable,
          overdueAmount,
          paymentsThisMonth,
        });
      }
    } catch (error) {
      toast.error("An error occurred while fetching statistics");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Accounts Payable Dashboard
        </h1>
        <p className="text-muted-foreground">
          Overview of your accounts payable activities
        </p>
      </div>

      {loading ? (
        <p className="text-center py-8">Loading dashboard...</p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Vendors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalVendors}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeVendors} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Unpaid Bills
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.unpaidBills}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.overdueBills} overdue
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Payable
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${stats.totalPayable.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Outstanding balance
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Overdue Amount
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  ${stats.overdueAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Requires attention
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common accounts payable tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/ap/vendors/new">
                  <Button variant="outline" className="w-full justify-start">
                    Add New Vendor
                  </Button>
                </Link>
                <Link href="/ap/bills/new">
                  <Button variant="outline" className="w-full justify-start">
                    Create Bill
                  </Button>
                </Link>
                <Link href="/ap/payments/new">
                  <Button variant="outline" className="w-full justify-start">
                    Record Payment
                  </Button>
                </Link>
                <Link href="/ap/bills?overdue=true">
                  <Button variant="outline" className="w-full justify-start">
                    View Overdue Bills
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activity Summary</CardTitle>
                <CardDescription>
                  Recent accounts payable metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Total Bills
                  </span>
                  <span className="text-sm font-medium">
                    {stats.totalBills}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Payments This Month
                  </span>
                  <span className="text-sm font-medium">
                    {stats.paymentsThisMonth}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Active Vendors
                  </span>
                  <span className="text-sm font-medium">
                    {stats.activeVendors}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Overdue Bills
                  </span>
                  <span className="text-sm font-medium text-red-600">
                    {stats.overdueBills}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
