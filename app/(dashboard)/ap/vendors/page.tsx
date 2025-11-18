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

interface Vendor {
  id: string;
  vendorNumber: string;
  vendorName: string;
  vendorType: string;
  email: string;
  phone: string;
  currentBalance: number;
  status: string;
}

export default function VendorsPage() {
  const { data: session } = useSession();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/ap/vendors");
      const data = await response.json();

      if (data.success) {
        setVendors(data.vendors);
      } else {
        toast.error(data.error?.message || "Failed to fetch vendors");
      }
    } catch (error) {
      toast.error("An error occurred while fetching vendors");
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter(
    (vendor) =>
      vendor.vendorNumber.toLowerCase().includes(search.toLowerCase()) ||
      vendor.vendorName.toLowerCase().includes(search.toLowerCase()) ||
      (vendor.email && vendor.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
          <p className="text-muted-foreground">
            Manage your company's vendors and suppliers
          </p>
        </div>
        <Link href="/ap/vendors/new">
          <Button>Add Vendor</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Vendor List</CardTitle>
            <Input
              placeholder="Search vendors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-4">Loading vendors...</p>
          ) : filteredVendors.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No vendors found</p>
              <Link href="/ap/vendors/new">
                <Button className="mt-4">Create First Vendor</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Vendor #</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Contact</th>
                    <th className="text-right p-2">Balance</th>
                    <th className="text-center p-2">Status</th>
                    <th className="text-center p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVendors.map((vendor) => (
                    <tr key={vendor.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-mono">{vendor.vendorNumber}</td>
                      <td className="p-2">{vendor.vendorName}</td>
                      <td className="p-2 capitalize">{vendor.vendorType}</td>
                      <td className="p-2">
                        <div className="text-sm">
                          {vendor.email && <div>{vendor.email}</div>}
                          {vendor.phone && <div className="text-muted-foreground">{vendor.phone}</div>}
                        </div>
                      </td>
                      <td className="p-2 text-right font-mono">
                        {Number(vendor.currentBalance).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="p-2 text-center">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs ${
                            vendor.status === "active"
                              ? "bg-green-100 text-green-800"
                              : vendor.status === "blocked"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {vendor.status}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <Link href={`/ap/vendors/${vendor.id}`}>
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
