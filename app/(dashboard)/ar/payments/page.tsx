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

interface Payment {
  id: string;
  paymentNumber: string;
  customer: {
    customerName: string;
  };
  paymentDate: string;
  paymentMethod: string;
  paymentAmount: number;
  allocatedAmount: number;
  unappliedAmount: number;
  status: string;
  isPosted: boolean;
}

export default function PaymentsPage() {
  const { data: session } = useSession();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/ar/payments");
      const data = await response.json();

      if (data.success) {
        setPayments(data.payments);
      } else {
        toast.error(data.error?.message || "Failed to fetch payments");
      }
    } catch (error) {
      toast.error("An error occurred while fetching payments");
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(
    (payment) =>
      payment.paymentNumber.toLowerCase().includes(search.toLowerCase()) ||
      payment.customer.customerName.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-blue-100 text-blue-800";
      case "posted":
        return "bg-green-100 text-green-800";
      case "voided":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Payments</h1>
          <p className="text-muted-foreground">
            Manage customer payments and receipts
          </p>
        </div>
        <Link href="/ar/payments/new">
          <Button>Record Payment</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Payment List</CardTitle>
            <Input
              placeholder="Search payments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-4">Loading payments...</p>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No payments found</p>
              <Link href="/ar/payments/new">
                <Button className="mt-4">Record First Payment</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Payment #</th>
                    <th className="text-left p-2">Customer</th>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Method</th>
                    <th className="text-right p-2">Amount</th>
                    <th className="text-right p-2">Allocated</th>
                    <th className="text-right p-2">Unapplied</th>
                    <th className="text-center p-2">Posted</th>
                    <th className="text-center p-2">Status</th>
                    <th className="text-center p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-mono">{payment.paymentNumber}</td>
                      <td className="p-2">{payment.customer.customerName}</td>
                      <td className="p-2">
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </td>
                      <td className="p-2 capitalize">
                        {payment.paymentMethod.replace(/_/g, " ")}
                      </td>
                      <td className="p-2 text-right font-mono">
                        {Number(payment.paymentAmount).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="p-2 text-right font-mono">
                        {Number(payment.allocatedAmount).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="p-2 text-right font-mono">
                        {Number(payment.unappliedAmount).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="p-2 text-center">
                        {payment.isPosted ? (
                          <span className="inline-block px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                            Yes
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                            No
                          </span>
                        )}
                      </td>
                      <td className="p-2 text-center">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs ${getStatusColor(
                            payment.status
                          )}`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <Link href={`/ar/payments/${payment.id}`}>
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
