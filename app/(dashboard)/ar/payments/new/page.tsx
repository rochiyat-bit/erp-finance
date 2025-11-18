"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function NewPaymentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerId: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "bank_transfer",
    paymentAmount: 0,
    bankAccountId: "",
    referenceNumber: "",
    checkNumber: "",
    currencyCode: "USD",
    exchangeRate: 1,
    description: "",
    notes: "",
  });

  const [allocations, setAllocations] = useState([
    {
      invoiceId: "",
      allocatedAmount: 0,
      discountGiven: 0,
    },
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Filter out empty allocations
      const validAllocations = allocations.filter(
        (alloc) => alloc.invoiceId && alloc.allocatedAmount > 0
      );

      const response = await fetch("/api/ar/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          allocations: validAllocations.length > 0 ? validAllocations : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Payment recorded successfully");
        router.push("/ar/payments");
      } else {
        toast.error(data.error?.message || "Failed to record payment");
      }
    } catch (error) {
      toast.error("An error occurred while recording payment");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "number"
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAllocationChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const newAllocations = [...allocations];
    newAllocations[index] = {
      ...newAllocations[index],
      [field]:
        typeof value === "string" && field !== "invoiceId"
          ? parseFloat(value) || 0
          : value,
    };
    setAllocations(newAllocations);
  };

  const addAllocation = () => {
    setAllocations([
      ...allocations,
      {
        invoiceId: "",
        allocatedAmount: 0,
        discountGiven: 0,
      },
    ]);
  };

  const removeAllocation = (index: number) => {
    if (allocations.length > 1) {
      setAllocations(allocations.filter((_, i) => i !== index));
    }
  };

  const calculateTotalAllocated = () => {
    return allocations.reduce(
      (sum, alloc) => sum + alloc.allocatedAmount + alloc.discountGiven,
      0
    );
  };

  const calculateUnapplied = () => {
    return formData.paymentAmount - calculateTotalAllocated();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Record Customer Payment</h1>
        <p className="text-muted-foreground">
          Record a payment received from a customer
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
              <CardDescription>Basic payment details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customerId">Customer ID *</Label>
                  <Input
                    id="customerId"
                    name="customerId"
                    value={formData.customerId}
                    onChange={handleChange}
                    required
                    placeholder="Enter customer UUID"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentDate">Payment Date *</Label>
                  <Input
                    id="paymentDate"
                    name="paymentDate"
                    type="date"
                    value={formData.paymentDate}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method *</Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) => handleSelectChange("paymentMethod", value)}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="debit_card">Debit Card</SelectItem>
                      <SelectItem value="e_wallet">E-Wallet</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentAmount">Payment Amount *</Label>
                  <Input
                    id="paymentAmount"
                    name="paymentAmount"
                    type="number"
                    step="0.01"
                    value={formData.paymentAmount}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankAccountId">Bank Account ID</Label>
                  <Input
                    id="bankAccountId"
                    name="bankAccountId"
                    value={formData.bankAccountId}
                    onChange={handleChange}
                    placeholder="Enter bank account UUID (optional)"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referenceNumber">Reference Number</Label>
                  <Input
                    id="referenceNumber"
                    name="referenceNumber"
                    value={formData.referenceNumber}
                    onChange={handleChange}
                    placeholder="e.g., Transaction ID"
                    disabled={loading}
                  />
                </div>

                {formData.paymentMethod === "check" && (
                  <div className="space-y-2">
                    <Label htmlFor="checkNumber">Check Number</Label>
                    <Input
                      id="checkNumber"
                      name="checkNumber"
                      value={formData.checkNumber}
                      onChange={handleChange}
                      placeholder="Check number"
                      disabled={loading}
                    />
                  </div>
                )}

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Optional description"
                    disabled={loading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Invoice Allocations</CardTitle>
                  <CardDescription>
                    Allocate payment to specific invoices (optional)
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  onClick={addAllocation}
                  variant="outline"
                  size="sm"
                  disabled={loading}
                >
                  Add Allocation
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {allocations.map((allocation, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Allocation {index + 1}</h4>
                    {allocations.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeAllocation(index)}
                        variant="ghost"
                        size="sm"
                        disabled={loading}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Invoice ID</Label>
                      <Input
                        value={allocation.invoiceId}
                        onChange={(e) =>
                          handleAllocationChange(index, "invoiceId", e.target.value)
                        }
                        placeholder="Enter invoice UUID"
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Allocated Amount</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={allocation.allocatedAmount}
                        onChange={(e) =>
                          handleAllocationChange(
                            index,
                            "allocatedAmount",
                            e.target.value
                          )
                        }
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Discount Given</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={allocation.discountGiven}
                        onChange={(e) =>
                          handleAllocationChange(
                            index,
                            "discountGiven",
                            e.target.value
                          )
                        }
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-end items-center pt-4 border-t">
                <div className="text-right space-y-1">
                  <div className="flex justify-between gap-8">
                    <span className="text-sm text-muted-foreground">Payment Amount:</span>
                    <span className="font-mono">{formData.paymentAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between gap-8">
                    <span className="text-sm text-muted-foreground">Total Allocated:</span>
                    <span className="font-mono">{calculateTotalAllocated().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between gap-8 border-t pt-1">
                    <span className="text-sm font-medium">Unapplied Amount:</span>
                    <span className="font-mono font-bold">{calculateUnapplied().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Recording..." : "Record Payment"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
