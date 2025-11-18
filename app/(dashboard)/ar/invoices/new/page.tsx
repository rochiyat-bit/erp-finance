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
import { toast } from "sonner";

export default function NewInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerId: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    currencyCode: "USD",
    exchangeRate: 1,
    description: "",
    notes: "",
  });

  const [lines, setLines] = useState([
    {
      itemName: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      revenueAccountId: "",
      taxPercent: 0,
      discountPercent: 0,
    },
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/ar/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          lines,
          discountAmount: 0,
          shippingAmount: 0,
          otherCharges: 0,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Invoice created successfully");
        router.push("/ar/invoices");
      } else {
        toast.error(data.error?.message || "Failed to create invoice");
      }
    } catch (error) {
      toast.error("An error occurred while creating invoice");
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

  const handleLineChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const newLines = [...lines];
    newLines[index] = {
      ...newLines[index],
      [field]: typeof value === "string" &&
                field !== "itemName" &&
                field !== "description" &&
                field !== "revenueAccountId"
        ? parseFloat(value as string) || 0
        : value,
    };
    setLines(newLines);
  };

  const addLine = () => {
    setLines([
      ...lines,
      {
        itemName: "",
        description: "",
        quantity: 1,
        unitPrice: 0,
        revenueAccountId: "",
        taxPercent: 0,
        discountPercent: 0,
      },
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const calculateLineTotal = (line: typeof lines[0]) => {
    const lineAmount = line.quantity * line.unitPrice;
    const discount = (lineAmount * line.discountPercent) / 100;
    const taxableAmount = lineAmount - discount;
    const tax = (taxableAmount * line.taxPercent) / 100;
    return taxableAmount + tax;
  };

  const calculateGrandTotal = () => {
    return lines.reduce((sum, line) => sum + calculateLineTotal(line), 0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Invoice</h1>
        <p className="text-muted-foreground">
          Create a customer invoice for goods or services
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Information</CardTitle>
              <CardDescription>Basic invoice details</CardDescription>
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
                  <Label htmlFor="invoiceDate">Invoice Date *</Label>
                  <Input
                    id="invoiceDate"
                    name="invoiceDate"
                    type="date"
                    value={formData.invoiceDate}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <Input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currencyCode">Currency</Label>
                  <Input
                    id="currencyCode"
                    name="currencyCode"
                    value={formData.currencyCode}
                    onChange={handleChange}
                    placeholder="USD"
                    disabled={loading}
                  />
                </div>

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

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Internal notes"
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
                  <CardTitle>Line Items</CardTitle>
                  <CardDescription>Invoice line items</CardDescription>
                </div>
                <Button
                  type="button"
                  onClick={addLine}
                  variant="outline"
                  size="sm"
                  disabled={loading}
                >
                  Add Line
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {lines.map((line, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Line {index + 1}</h4>
                    {lines.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeLine(index)}
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
                      <Label>Item Name *</Label>
                      <Input
                        value={line.itemName}
                        onChange={(e) =>
                          handleLineChange(index, "itemName", e.target.value)
                        }
                        required
                        placeholder="e.g., Consulting Services"
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Revenue Account ID *</Label>
                      <Input
                        value={line.revenueAccountId}
                        onChange={(e) =>
                          handleLineChange(
                            index,
                            "revenueAccountId",
                            e.target.value
                          )
                        }
                        required
                        placeholder="Account UUID"
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Quantity *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={line.quantity}
                        onChange={(e) =>
                          handleLineChange(index, "quantity", e.target.value)
                        }
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Unit Price *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={line.unitPrice}
                        onChange={(e) =>
                          handleLineChange(index, "unitPrice", e.target.value)
                        }
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tax Rate (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={line.taxPercent}
                        onChange={(e) =>
                          handleLineChange(index, "taxPercent", e.target.value)
                        }
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Discount (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={line.discountPercent}
                        onChange={(e) =>
                          handleLineChange(index, "discountPercent", e.target.value)
                        }
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-3">
                      <Label>Description</Label>
                      <Input
                        value={line.description}
                        onChange={(e) =>
                          handleLineChange(index, "description", e.target.value)
                        }
                        placeholder="Optional line description"
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Line Total</Label>
                      <Input
                        value={calculateLineTotal(line).toFixed(2)}
                        disabled
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-end items-center pt-4 border-t">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Grand Total</p>
                  <p className="text-2xl font-bold">
                    {calculateGrandTotal().toFixed(2)}
                  </p>
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
              {loading ? "Creating..." : "Create Invoice"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
