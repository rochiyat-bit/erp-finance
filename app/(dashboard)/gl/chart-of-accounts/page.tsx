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

interface Account {
  id: string;
  code: string;
  name: string;
  accountType: string;
  currentBalance: number;
  isActive: boolean;
}

export default function ChartOfAccountsPage() {
  const { data: session } = useSession();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/gl/chart-of-accounts");
      const data = await response.json();

      if (data.success) {
        setAccounts(data.accounts);
      } else {
        toast.error(data.error?.message || "Failed to fetch accounts");
      }
    } catch (error) {
      toast.error("An error occurred while fetching accounts");
    } finally {
      setLoading(false);
    }
  };

  const filteredAccounts = accounts.filter(
    (account) =>
      account.code.toLowerCase().includes(search.toLowerCase()) ||
      account.name.toLowerCase().includes(search.toLowerCase())
  );

  const groupedAccounts = filteredAccounts.reduce((groups: any, account) => {
    const type = account.accountType;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(account);
    return groups;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Chart of Accounts
          </h1>
          <p className="text-muted-foreground">
            Manage your company's chart of accounts
          </p>
        </div>
        <Link href="/gl/chart-of-accounts/new">
          <Button>Add Account</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Accounts</CardTitle>
            <Input
              placeholder="Search accounts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-4">Loading accounts...</p>
          ) : filteredAccounts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No accounts found</p>
              <Link href="/gl/chart-of-accounts/new">
                <Button className="mt-4">Create First Account</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedAccounts).map(([type, accts]: [string, any]) => (
                <div key={type}>
                  <h3 className="text-lg font-semibold capitalize mb-3">
                    {type}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Code</th>
                          <th className="text-left p-2">Name</th>
                          <th className="text-right p-2">Balance</th>
                          <th className="text-center p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accts.map((account: Account) => (
                          <tr key={account.id} className="border-b hover:bg-muted/50">
                            <td className="p-2 font-mono">{account.code}</td>
                            <td className="p-2">{account.name}</td>
                            <td className="p-2 text-right font-mono">
                              {Number(account.currentBalance).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="p-2 text-center">
                              <span
                                className={`inline-block px-2 py-1 rounded text-xs ${
                                  account.isActive
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {account.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
