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

interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: {
    customerName: string;
  };
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: string;
  status: string;
  isPosted: boolean;
  isOverdue: boolean;
}

export default function InvoicesPage() {
  const { data: session } = useSession();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/ar/invoices");
      const data = await response.json();

      if (data.success) {
        setInvoices(data.invoices);
      } else {
        toast.error(data.error?.message || "Failed to fetch invoices");
      }
    } catch (error) {
      toast.error("An error occurred while fetching invoices");
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      invoice.customer.customerName.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "pending_approval":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-blue-100 text-blue-800";
      case "sent":
        return "bg-purple-100 text-purple-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "unpaid":
        return "bg-red-100 text-red-800";
      case "partial":
        return "bg-yellow-100 text-yellow-800";
      case "paid":
        return "bg-green-100 text-green-800";
      case "overpaid":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            Manage customer invoices and receivables
          </p>
        </div>
        <Link href="/ar/invoices/new">
          <Button>Create Invoice</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Invoice List</CardTitle>
            <Input
              placeholder="Search invoices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-4">Loading invoices...</p>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No invoices found</p>
              <Link href="/ar/invoices/new">
                <Button className="mt-4">Create First Invoice</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Invoice #</th>
                    <th className="text-left p-2">Customer</th>
                    <th className="text-left p-2">Invoice Date</th>
                    <th className="text-left p-2">Due Date</th>
                    <th className="text-right p-2">Total</th>
                    <th className="text-right p-2">Paid</th>
                    <th className="text-right p-2">Balance</th>
                    <th className="text-center p-2">Payment</th>
                    <th className="text-center p-2">Status</th>
                    <th className="text-center p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-mono">{invoice.invoiceNumber}</td>
                      <td className="p-2">{invoice.customer.customerName}</td>
                      <td className="p-2">
                        {new Date(invoice.invoiceDate).toLocaleDateString()}
                      </td>
                      <td className="p-2">
                        <span className={invoice.isOverdue ? "text-red-600 font-medium" : ""}>
                          {new Date(invoice.dueDate).toLocaleDateString()}
                          {invoice.isOverdue && " (Overdue)"}
                        </span>
                      </td>
                      <td className="p-2 text-right font-mono">
                        {Number(invoice.totalAmount).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="p-2 text-right font-mono">
                        {Number(invoice.paidAmount).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="p-2 text-right font-mono">
                        {Number(invoice.balanceAmount).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="p-2 text-center">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs ${getPaymentStatusColor(
                            invoice.paymentStatus
                          )}`}
                        >
                          {invoice.paymentStatus}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs ${getStatusColor(
                            invoice.status
                          )}`}
                        >
                          {invoice.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <Link href={`/ar/invoices/${invoice.id}`}>
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
