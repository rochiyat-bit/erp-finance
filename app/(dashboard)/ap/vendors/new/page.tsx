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

export default function NewVendorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vendorName: "",
    vendorType: "company",
    email: "",
    phone: "",
    mobile: "",
    contactPerson: "",
    billingAddress: "",
    billingCity: "",
    billingState: "",
    billingPostalCode: "",
    billingCountry: "",
    paymentTerms: "Net 30",
    paymentTermDays: 30,
    currencyCode: "USD",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/ap/vendors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Vendor created successfully");
        router.push("/ap/vendors");
      } else {
        toast.error(data.error?.message || "Failed to create vendor");
      }
    } catch (error) {
      toast.error("An error occurred while creating vendor");
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Create New Vendor
        </h1>
        <p className="text-muted-foreground">
          Add a new vendor to your accounts payable
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Vendor Details</CardTitle>
            <CardDescription>
              Enter the details for the new vendor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="vendorName">Vendor Name *</Label>
                <Input
                  id="vendorName"
                  name="vendorName"
                  value={formData.vendorName}
                  onChange={handleChange}
                  required
                  placeholder="e.g., ABC Supplies Inc."
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendorType">Vendor Type *</Label>
                <select
                  id="vendorType"
                  name="vendorType"
                  value={formData.vendorType}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                  disabled={loading}
                >
                  <option value="company">Company</option>
                  <option value="individual">Individual</option>
                  <option value="government">Government</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="vendor@example.com"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 234 567 8900"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input
                  id="contactPerson"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  placeholder="John Doe"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile</Label>
                <Input
                  id="mobile"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="+1 234 567 8900"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="billingAddress">Billing Address</Label>
                <Input
                  id="billingAddress"
                  name="billingAddress"
                  value={formData.billingAddress}
                  onChange={handleChange}
                  placeholder="123 Main St"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="billingCity">City</Label>
                <Input
                  id="billingCity"
                  name="billingCity"
                  value={formData.billingCity}
                  onChange={handleChange}
                  placeholder="New York"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="billingState">State/Province</Label>
                <Input
                  id="billingState"
                  name="billingState"
                  value={formData.billingState}
                  onChange={handleChange}
                  placeholder="NY"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="billingPostalCode">Postal Code</Label>
                <Input
                  id="billingPostalCode"
                  name="billingPostalCode"
                  value={formData.billingPostalCode}
                  onChange={handleChange}
                  placeholder="10001"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="billingCountry">Country</Label>
                <Input
                  id="billingCountry"
                  name="billingCountry"
                  value={formData.billingCountry}
                  onChange={handleChange}
                  placeholder="USA"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment Terms *</Label>
                <Input
                  id="paymentTerms"
                  name="paymentTerms"
                  value={formData.paymentTerms}
                  onChange={handleChange}
                  required
                  placeholder="Net 30"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentTermDays">Payment Term Days *</Label>
                <Input
                  id="paymentTermDays"
                  name="paymentTermDays"
                  type="number"
                  value={formData.paymentTermDays}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Vendor"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
