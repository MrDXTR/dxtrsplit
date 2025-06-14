"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Receipt, MoreVertical, Loader2, Trash2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/shared";
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
import { ExpenseForm } from "~/app/_components/ExpenseForm";

type Group = RouterOutputs["group"]["getById"];

interface ExpensesListProps {
  group: Group;
  onExpenseDeleted: () => void;
  onExpenseSettled: () => void;
  onExpenseUnsettled: () => void;
}

export function ExpensesList({
  group,
  onExpenseDeleted,
  onExpenseSettled,
  onExpenseUnsettled,
}: ExpensesListProps) {
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const utils = api.useUtils();

  const deleteExpense = api.expense.delete.useMutation({
    onMutate: () => {
      toast.loading("Deleting expense...", {
        id: "delete-expense",
      });
    },
    onSuccess: async () => {
      if (!group) return;
      await utils.group.getById.invalidate();
      await utils.expense.getBalances.invalidate(group.id);
      toast.success("Expense deleted successfully", {
        id: "delete-expense",
        style: {
          backgroundColor: "#fee2e2",
          color: "#991b1b",
          borderColor: "#fecaca",
        },
      });
      setExpenseToDelete(null);
      onExpenseDeleted();
    },
    onError: () => {
      toast.error("Failed to delete expense", {
        id: "delete-expense",
      });
    },
  });

  const handleDelete = () => {
    if (expenseToDelete) {
      deleteExpense.mutate(expenseToDelete);
    }
  };

  const handleExpenseCreated = async () => {
    await utils.group.getById.invalidate();
    await utils.expense.getBalances.invalidate();
    setIsAddingExpense(false);
  };

  if (!group) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="h-full border-0 bg-white/80 shadow-xl shadow-indigo-100/50 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-200/60 dark:bg-gray-800/80 dark:shadow-none dark:hover:shadow-none">
        <CardHeader className="pb-4">
          <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center md:gap-0">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 p-2">
                <Receipt className="h-6 w-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
                Expenses
              </span>
            </CardTitle>
            <div>
              <ExpenseForm
                groupId={group.id}
                people={group.people}
                onSuccess={handleExpenseCreated}
                trigger={
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 dark:from-indigo-500 dark:to-purple-500 dark:text-white dark:hover:from-indigo-600 dark:hover:to-purple-600"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Expense
                  </Button>
                }
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="max-h-[calc(100vh-24rem)] overflow-y-auto">
          <div className="space-y-4">
            {group.expenses.length === 0 ? (
              <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                <Receipt className="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
                <p className="text-lg">No expenses yet</p>
              </div>
            ) : (
              group.expenses.map((expense: any, index: number) => (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative overflow-hidden rounded-xl border border-gray-200/60 bg-gradient-to-r from-white to-gray-50/50 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-blue-100/50 dark:border-gray-700/60 dark:from-gray-800 dark:to-gray-900/50 dark:hover:shadow-blue-900/20"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-blue-500/10 dark:to-indigo-500/10" />
                  <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900 transition-colors group-hover:text-blue-700 dark:text-gray-100 dark:group-hover:text-blue-400">
                          {expense.description}
                        </h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/50 dark:text-blue-400"
                        >
                          Paid by {expense.paidBy.name}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-1 ">
                      <p className="text-2xl text-right font-bold text-gray-900 transition-colors group-hover:text-green-600 dark:text-gray-100 dark:group-hover:text-green-400">
                        ₹{expense.amount.toFixed(2)}
                      </p>
                      <div className="flex items-center text-end gap-1 text-sm text-gray-600 dark:text-gray-400">
                        <span >Split {expense.shares.length} ways</span>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600 dark:text-red-500 dark:focus:text-red-500"
                        onClick={() => setExpenseToDelete(expense.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Expense Confirmation Dialog */}
      <AlertDialog
        open={!!expenseToDelete}
        onOpenChange={(open) => {
          if (!open) {
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600 dark:bg-red-700 dark:hover:bg-red-800 dark:focus:ring-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
