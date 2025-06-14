"use client";

import { motion, AnimatePresence } from "framer-motion";
import { api } from "~/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { toast } from "sonner";
import {
  Receipt,
  Users,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Trash2,
  MoreVertical,
  CheckCircle,
  Loader2,
  Plus,
  UserPlus,
  UserMinus,
} from "lucide-react";
import type { RouterOutputs } from "~/trpc/shared";
import { Button } from "~/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useState } from "react";
import { Skeleton } from "~/components/ui/skeleton";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { Group } from "./group/utils";
import { GroupHeader } from "./group/GroupHeader";
import { PeopleManagement } from "./group/PeopleManagement";
import { ExpensesList } from "./group/ExpensesList";
import { SettlementsList } from "./group/SettlementsList";
import { getWhoOwesWhom, getPendingSettlementsCount } from "./group/utils";

interface GroupSummaryProps {
  group: Group;
  onExpenseCreated?: () => Promise<void>;
  setShowMembersDialog?: (show: boolean) => void;
}

export function GroupSummary({
  group,
  onExpenseCreated,
  setShowMembersDialog,
}: GroupSummaryProps) {
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [settlingUpExpense, setSettlingUpExpense] = useState<string | null>(
    null,
  );
  const [newPersonName, setNewPersonName] = useState("");
  const [personToDelete, setPersonToDelete] = useState<string | null>(null);
  const [isDeletingPerson, setIsDeletingPerson] = useState(false);
  const utils = api.useUtils();
  const { data: balances, isLoading: isLoadingBalances } =
    api.expense.getBalances.useQuery(group.id);

  const deleteExpense = api.expense.delete.useMutation({
    onMutate: () => {
      toast.loading("Deleting expense...", {
        id: "delete-expense",
      });
    },
    onSuccess: async () => {
      await utils.group.getById.invalidate();
      await utils.expense.getBalances.invalidate();
      toast.success("Expense deleted successfully", {
        id: "delete-expense",
        style: {
          backgroundColor: "#fee2e2",
          color: "#991b1b",
          borderColor: "#fecaca",
        },
      });
    },
    onError: () => {
      toast.error("Failed to delete expense", {
        id: "delete-expense",
      });
    },
  });

  const settleUpExpense = api.expense.settleUp.useMutation({
    onMutate: () => {
      toast.loading("Settling expense...", {
        id: "settle-expense",
      });
    },
    onSuccess: async () => {
      await utils.group.getById.invalidate();
      await utils.expense.getBalances.invalidate();
      toast.success("Expense settled successfully", {
        id: "settle-expense",
      });
    },
    onError: () => {
      toast.error("Failed to settle expense", {
        id: "settle-expense",
      });
    },
  });

  const addPerson = api.group.addPerson.useMutation({
    onMutate: () => {
      toast.loading("Adding person...", {
        id: "add-person",
      });
    },
    onSuccess: async () => {
      setNewPersonName("");
      await utils.group.getById.invalidate(group.id);
      await utils.expense.getBalances.invalidate(group.id);
      toast.success("Person added successfully", {
        id: "add-person",
      });
    },
    onError: () => {
      toast.error("Failed to add person", {
        id: "add-person",
      });
    },
  });

  const deletePerson = api.group.deletePerson.useMutation({
    onMutate: () => {
      toast.loading("Deleting person...", {
        id: "delete-person",
      });
    },
    onSuccess: async () => {
      await utils.group.getById.invalidate(group.id);
      await utils.expense.getBalances.invalidate(group.id);
      toast.success("Person deleted successfully", {
        id: "delete-person",
        style: {
          backgroundColor: "#fee2e2",
          color: "#991b1b",
          borderColor: "#fecaca",
        },
      });
      setPersonToDelete(null);
    },
    onError: () => {
      toast.error("Failed to delete person", {
        id: "delete-person",
      });
    },
  });

  const handleDeleteExpense = async () => {
    if (expenseToDelete) {
      setIsDeleting(true);
      try {
        await deleteExpense.mutateAsync(expenseToDelete);
        // Wait for the data to be refetched
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } finally {
        setIsDeleting(false);
        setExpenseToDelete(null);
      }
    }
  };

  const handleSettleUp = async (expenseId: string) => {
    setSettlingUpExpense(expenseId);
    try {
      await settleUpExpense.mutateAsync(expenseId);
      // Wait for the data to be refetched
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } finally {
      setSettlingUpExpense(null);
    }
  };

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonName.trim()) return;
    addPerson.mutate({
      groupId: group.id,
      name: newPersonName.trim(),
    });
  };

  const handleDeletePerson = async () => {
    if (personToDelete) {
      setIsDeletingPerson(true);
      try {
        await deletePerson.mutateAsync({
          groupId: group.id,
          personId: personToDelete,
        });
        // Wait for the data to be refetched
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } finally {
        setIsDeletingPerson(false);
        setPersonToDelete(null);
      }
    }
  };

  const totalExpenses = group.expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );

  const mappedBalances =
    balances
      ?.map((b) => ({
        person: b.person ? { id: b.person.id, name: b.person.name } : null,
        balance: b.balance,
      }))
      .filter(
        (b): b is { person: { id: string; name: string }; balance: number } =>
          b.person !== null,
      ) ?? [];

  const whoOwesWhom = getWhoOwesWhom(mappedBalances);

  const hasUnsettledExpenses = group.expenses.some(
    (expense) => !expense.settled,
  );
  const isAllSettled = !hasUnsettledExpenses || whoOwesWhom.length === 0;

  const pendingSettlements = group.expenses.filter(
    (expense) => !expense.settled,
  ).length;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="container mx-auto max-w-7xl space-y-8">
        <GroupHeader
          group={group}
          totalExpenses={totalExpenses}
          isLoadingBalances={isLoadingBalances}
          isAllSettled={isAllSettled}
          pendingSettlements={pendingSettlements}
          isOwner={group.isOwner}
          hasUnsettledExpenses={hasUnsettledExpenses}
          onExpenseCreated={onExpenseCreated}
          setShowMembersDialog={setShowMembersDialog}
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <PeopleManagement group={group} />
          <ExpensesList
            group={group}
            onExpenseDeleted={() => {
              void utils.group.getById.invalidate(group.id);
              void utils.expense.getBalances.invalidate(group.id);
            }}
            onExpenseSettled={() => {
              void utils.group.getById.invalidate(group.id);
              void utils.expense.getBalances.invalidate(group.id);
            }}
            onExpenseUnsettled={() => {
              void utils.group.getById.invalidate(group.id);
              void utils.expense.getBalances.invalidate(group.id);
            }}
          />
          <div className="lg:col-span-2">
            <SettlementsList
              balances={mappedBalances}
              isLoading={isLoadingBalances}
              hasUnsettledExpenses={hasUnsettledExpenses}
              groupId={group.id}
            />
          </div>
        </div>

        {/* Delete Person Confirmation Dialog */}
        <AlertDialog
          open={!!personToDelete}
          onOpenChange={(open) => {
            if (!open && !isDeletingPerson) {
              setPersonToDelete(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                person and all their associated expenses.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeletingPerson}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeletePerson}
                disabled={isDeletingPerson}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                {isDeletingPerson ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Deleting...
                  </div>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Expense Confirmation Dialog */}
        <AlertDialog
          open={!!expenseToDelete}
          onOpenChange={(open) => {
            if (!open && !isDeleting) {
              setExpenseToDelete(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                expense.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteExpense}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                {isDeleting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Deleting...
                  </div>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
