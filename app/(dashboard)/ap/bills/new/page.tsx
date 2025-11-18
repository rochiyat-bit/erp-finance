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

export default function NewBillPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vendorId: "",
    vendorInvoiceNumber: "",
    billDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    apAccountId: "",
    description: "",
    currencyCode: "USD",
    exchangeRate: 1,
  });

  const [lines, setLines] = useState([
    {
      itemName: "",
      description: "",
      expenseAccountId: "",
      quantity: 1,
      unitPrice: 0,
      taxRate: 0,
      discountPercent: 0,
    },
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/ap/bills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          lines,
          shippingAmount: 0,
          otherCharges: 0,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Bill created successfully");
        router.push("/ap/bills");
      } else {
        toast.error(data.error?.message || "Failed to create bill");
      }
    } catch (error) {
      toast.error("An error occurred while creating bill");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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
      [field]: typeof value === "string" && field !== "itemName" && field !== "description" && field !== "expenseAccountId"
        ? parseFloat(value) || 0
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
        expenseAccountId: "",
        quantity: 1,
        unitPrice: 0,
        taxRate: 0,
        discountPercent: 0,
      },
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Bill</h1>
        <p className="text-muted-foreground">
          Create a new vendor bill or invoice
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bill Information</CardTitle>
              <CardDescription>Basic bill details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="vendorId">Vendor ID *</Label>
                  <Input
                    id="vendorId"
                    name="vendorId"
                    value={formData.vendorId}
                    onChange={handleChange}
                    required
                    placeholder="Enter vendor UUID"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendorInvoiceNumber">
                    Vendor Invoice # *
                  </Label>
                  <Input
                    id="vendorInvoiceNumber"
                    name="vendorInvoiceNumber"
                    value={formData.vendorInvoiceNumber}
                    onChange={handleChange}
                    required
                    placeholder="INV-001"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="billDate">Bill Date *</Label>
                  <Input
                    id="billDate"
                    name="billDate"
                    type="date"
                    value={formData.billDate}
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
                  <Label htmlFor="apAccountId">AP Account ID *</Label>
                  <Input
                    id="apAccountId"
                    name="apAccountId"
                    value={formData.apAccountId}
                    onChange={handleChange}
                    required
                    placeholder="Enter AP account UUID"
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
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Line Items</CardTitle>
                  <CardDescription>Bill line items</CardDescription>
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
                        placeholder="e.g., Office Supplies"
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Expense Account ID *</Label>
                      <Input
                        value={line.expenseAccountId}
                        onChange={(e) =>
                          handleLineChange(
                            index,
                            "expenseAccountId",
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
                        value={line.taxRate}
                        onChange={(e) =>
                          handleLineChange(index, "taxRate", e.target.value)
                        }
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Line Total</Label>
                      <Input
                        value={(line.quantity * line.unitPrice).toFixed(2)}
                        disabled
                      />
                    </div>
                  </div>
                </div>
              ))}
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
              {loading ? "Creating..." : "Create Bill"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
