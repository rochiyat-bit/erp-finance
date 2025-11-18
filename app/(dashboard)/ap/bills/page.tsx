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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";

interface Bill {
  id: string;
  billNumber: string;
  vendorInvoiceNumber: string;
  vendor: {
    vendorName: string;
  };
  billDate: string;
  dueDate: string;
  totalAmount: number;
  outstandingAmount: number;
  status: string;
}

export default function BillsPage() {
  const { data: session } = useSession();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/ap/bills");
      const data = await response.json();

      if (data.success) {
        setBills(data.bills);
      } else {
        toast.error(data.error?.message || "Failed to fetch bills");
      }
    } catch (error) {
      toast.error("An error occurred while fetching bills");
    } finally {
      setLoading(false);
    }
  };

  const filteredBills = bills.filter(
    (bill) =>
      bill.billNumber.toLowerCase().includes(search.toLowerCase()) ||
      bill.vendorInvoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      bill.vendor.vendorName.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "pending_approval":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-blue-100 text-blue-800";
      case "posted":
        return "bg-purple-100 text-purple-800";
      case "partially_paid":
        return "bg-orange-100 text-orange-800";
      case "paid":
        return "bg-green-100 text-green-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bills</h1>
          <p className="text-muted-foreground">
            Manage vendor bills and invoices
          </p>
        </div>
        <Link href="/ap/bills/new">
          <Button>Create Bill</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Bill List</CardTitle>
            <Input
              placeholder="Search bills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-4">Loading bills...</p>
          ) : filteredBills.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No bills found</p>
              <Link href="/ap/bills/new">
                <Button className="mt-4">Create First Bill</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Bill #</th>
                    <th className="text-left p-2">Vendor Invoice #</th>
                    <th className="text-left p-2">Vendor</th>
                    <th className="text-left p-2">Bill Date</th>
                    <th className="text-left p-2">Due Date</th>
                    <th className="text-right p-2">Total</th>
                    <th className="text-right p-2">Outstanding</th>
                    <th className="text-center p-2">Status</th>
                    <th className="text-center p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.map((bill) => (
                    <tr key={bill.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-mono">{bill.billNumber}</td>
                      <td className="p-2">{bill.vendorInvoiceNumber}</td>
                      <td className="p-2">{bill.vendor.vendorName}</td>
                      <td className="p-2">
                        {new Date(bill.billDate).toLocaleDateString()}
                      </td>
                      <td className="p-2">
                        {new Date(bill.dueDate).toLocaleDateString()}
                      </td>
                      <td className="p-2 text-right font-mono">
                        {Number(bill.totalAmount).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="p-2 text-right font-mono">
                        {Number(bill.outstandingAmount).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="p-2 text-center">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs ${getStatusColor(
                            bill.status
                          )}`}
                        >
                          {bill.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <Link href={`/ap/bills/${bill.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
