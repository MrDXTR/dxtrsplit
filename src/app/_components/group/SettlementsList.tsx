"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, Check, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { 
  getWhoOwesWhom, 
  type Transaction, 
  convertSettledExpensesToTransactions, 
  hasUnsettledTransactions as checkUnsettledTransactions,
  filterTransactions,
  areAllTransactionsSettled
} from "./utils";
import { useState, useEffect, useRef } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
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

interface SettlementsListProps {
  balances: { person: { id: string; name: string }; balance: number }[];
  isLoading: boolean;
  hasUnsettledExpenses?: boolean;
  groupId: string;
}

export function SettlementsList({
  balances,
  isLoading,
  hasUnsettledExpenses = true,
  groupId,
}: SettlementsListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settlingTransaction, setSettlingTransaction] = useState<number | null>(null);
  const [isSettlingAll, setIsSettlingAll] = useState(false);
  const [showConfirmSettleAll, setShowConfirmSettleAll] = useState(false);
  const [showSettled, setShowSettled] = useState(true);
  
  // Track if balances have changed to prevent unnecessary recalculations
  const balancesRef = useRef(balances);
  
  // Utils for API calls
  const utils = api.useUtils();

  // Fetch settlement data
  const { data: settledExpenses } = api.expense.getSettlements.useQuery(
    groupId,
    {
      // Ensure we refetch after mutations
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true
    }
  );
  
  // Compute derived state
  const hasUnsettledTx = checkUnsettledTransactions(transactions);
  const isAllSettled = areAllTransactionsSettled(transactions);
  const filteredTx = filterTransactions(transactions, showSettled);
  
  // Show "All Settled" message only when there are no unsettled transactions and we're not showing settled ones
  const showAllSettled = !hasUnsettledTx && !showSettled;

  // Update transactions when balances change
  useEffect(() => {
    // Skip if balances haven't changed
    if (JSON.stringify(balancesRef.current) === JSON.stringify(balances)) {
      return;
    }
    
    // Update reference and calculate new transactions
    balancesRef.current = balances;
    const newTransactions = getWhoOwesWhom(balances);
    
    // Apply settled status if we have settlement data
    if (settledExpenses) {
      const settledTx = convertSettledExpensesToTransactions(settledExpenses);
      
      // Apply settled status to new transactions
      setTransactions(newTransactions.map(tx => {
        const isSettled = settledTx.some(
          settled => 
            tx.from === settled.from && 
            tx.to === settled.to && 
            Math.abs(tx.amount - settled.amount) < 0.01
        );
        
        return { ...tx, isSettled };
      }));
    } else {
      setTransactions(newTransactions);
    }
  }, [balances, settledExpenses]);
  
  // Update settled status when settled expenses data changes
  useEffect(() => {
    if (!settledExpenses || transactions.length === 0) return;
    
    const settledTx = convertSettledExpensesToTransactions(settledExpenses);
    
    setTransactions(prev => 
      prev.map(tx => {
        const isSettled = settledTx.some(
          settled => 
            tx.from === settled.from && 
            tx.to === settled.to && 
            Math.abs(tx.amount - settled.amount) < 0.01
        );
        
        return { ...tx, isSettled };
      })
    );
  }, [settledExpenses]);

  // API mutation for settling a single transaction
  const settleTransaction = api.expense.settleTransaction.useMutation({
    onMutate: () => {
      toast.loading("Settling transaction...", {
        id: "settle-transaction",
      });
    },
    onSuccess: async () => {
      // Invalidate all related queries to trigger refetching
      await utils.expense.getBalances.invalidate(groupId);
      await utils.expense.getSettlements.invalidate(groupId);
      await utils.group.getById.invalidate(groupId);
      
      toast.success("Transaction settled successfully", {
        id: "settle-transaction",
        style: {
          backgroundColor: "#dcfce7",
          color: "#166534",
          borderColor: "#bbf7d0",
        },
      });
    },
    onError: () => {
      toast.error("Failed to settle transaction", {
        id: "settle-transaction",
      });
    },
    onSettled: () => {
      setSettlingTransaction(null);
    },
  });

  // API mutation for settling all transactions
  const settleAllTransactions = api.expense.settleAllTransactions.useMutation({
    onMutate: () => {
      toast.loading("Settling all transactions...", {
        id: "settle-all-transactions",
      });
    },
    onSuccess: async () => {
      // Invalidate all related queries to trigger refetching
      await utils.expense.getBalances.invalidate(groupId);
      await utils.expense.getSettlements.invalidate(groupId);
      await utils.group.getById.invalidate(groupId);
      
      toast.success("All transactions settled successfully", {
        id: "settle-all-transactions",
        style: {
          backgroundColor: "#dcfce7",
          color: "#166534",
          borderColor: "#bbf7d0",
        },
      });
    },
    onError: () => {
      toast.error("Failed to settle all transactions", {
        id: "settle-all-transactions",
      });
    },
    onSettled: () => {
      setIsSettlingAll(false);
      setShowConfirmSettleAll(false);
    },
  });

  // Handler for settling a single transaction
  const handleSettleTransaction = (
    index: number,
    from: string,
    to: string,
    amount: number,
  ) => {
    setSettlingTransaction(index);
    settleTransaction.mutate({
      groupId,
      fromName: from,
      toName: to,
      amount,
    });
  };

  // Handler for settling all transactions
  const handleSettleAllTransactions = () => {
    setIsSettlingAll(true);
    settleAllTransactions.mutate(groupId);
  };
  
  // Toggle showing/hiding settled transactions
  const toggleShowSettled = () => {
    setShowSettled((prev) => !prev);
  };

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
                <ArrowRight className="h-6 w-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
                Settlements
              </span>
            </CardTitle>
            <div className="flex items-center gap-2">
              {transactions.length > 0 && (
                <Button 
                  size="sm"
                  variant="outline"
                  className="border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-400 dark:hover:bg-indigo-800"
                  onClick={toggleShowSettled}
                >
                  {showSettled ? "Hide Settled" : "Show All"}
                </Button>
              )}
              {hasUnsettledTx && (
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 dark:from-green-500 dark:to-emerald-500 dark:text-white dark:hover:from-green-600 dark:hover:to-emerald-600"
                  onClick={() => setShowConfirmSettleAll(true)}
                  disabled={isSettlingAll}
                >
                  {isSettlingAll ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Settling All...
                    </div>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Settle All
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-12 w-full dark:bg-gray-700" />
                  </div>
                ))}
              </div>
            ) : showAllSettled ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="py-12 text-center"
              >
                <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-600">
                  <CheckCircle2 className="h-10 w-10 text-white" />
                </div>
                <h3 className="mb-2 text-2xl font-bold text-green-700 dark:text-green-400">
                  All Settled Up!
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Everyone&apos;s debts are cleared
                </p>
              </motion.div>
            ) : filteredTx.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-gray-500">No transactions to show</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTx.map((tx, idx) => {
                  const isSettling = settlingTransaction === idx;
                  const isSettled = tx.isSettled;
                  
                  const boxColorClass = isSettled
                    ? "border-green-200/60 bg-gradient-to-r from-green-50 to-emerald-50 dark:border-green-900/30 dark:from-green-900/20 dark:to-emerald-900/20 dark:hover:shadow-green-900/20"
                    : "border-orange-200/60 bg-gradient-to-r from-orange-50 to-red-50 dark:border-orange-900/30 dark:from-orange-900/20 dark:to-red-900/20 dark:hover:shadow-orange-900/20";
                    
                  const glowColorClass = isSettled
                    ? "from-green-500/5 to-emerald-500/5 group-hover:opacity-100 dark:from-green-500/10 dark:to-emerald-500/10"
                    : "from-orange-500/5 to-red-500/5 group-hover:opacity-100 dark:from-orange-500/10 dark:to-red-500/10";
                    
                  const amountColorClass = isSettled
                    ? "text-green-600 group-hover:text-green-700 dark:text-green-400 dark:group-hover:text-green-300"
                    : "text-red-600 group-hover:text-red-700 dark:text-red-400 dark:group-hover:text-red-300";
                  
                  return (
                    <motion.div
                      key={`${tx.from}-${tx.to}-${tx.amount}`}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{ 
                        delay: idx * 0.05, 
                        duration: 0.3,
                        type: "spring",
                        stiffness: 100,
                      }}
                      className={`group relative overflow-hidden rounded-xl border ${boxColorClass} p-4 hover:shadow-lg hover:shadow-orange-100/50`}
                      style={{ 
                        willChange: "transform, opacity",
                        transform: "translate3d(0, 0, 0)",
                      }}
                    >
                      <div
                        className={`absolute inset-0 bg-gradient-to-r ${glowColorClass} pointer-events-none opacity-0 transition-opacity duration-300`}
                      />
                      <div className="relative z-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="border-orange-300 bg-orange-100 font-semibold text-orange-800 dark:border-orange-700 dark:bg-orange-900/50 dark:text-orange-300">
                            {tx.from}
                          </Badge>
                          <ArrowRight className="h-4 w-4 text-gray-500 transition-colors group-hover:text-orange-600 dark:text-gray-400 dark:group-hover:text-orange-400" />
                          <Badge className="border-green-300 bg-green-100 font-semibold text-green-800 dark:border-green-700 dark:bg-green-900/50 dark:text-green-300">
                            {tx.to}
                          </Badge>
                          {isSettled && (
                            <Badge className="border-green-200 bg-green-100 text-green-700 dark:border-green-800 dark:bg-green-900/50 dark:text-green-400">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Settled
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-2xl font-bold ${amountColorClass}`}
                          >
                            ₹{tx.amount.toFixed(2)}
                          </span>
                          {!isSettled && (
                            <Button
                              size="sm"
                              className="relative z-20 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSettleTransaction(
                                  idx,
                                  tx.from,
                                  tx.to,
                                  tx.amount,
                                );
                              }}
                              disabled={isSettling}
                            >
                              {isSettling ? (
                                <div className="flex items-center gap-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Settling...
                                </div>
                              ) : (
                                <>
                                  <Check className="mr-2 h-4 w-4" />
                                  Settle
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Confirm Settle All Dialog */}
      <AlertDialog
        open={showConfirmSettleAll}
        onOpenChange={(open) => {
          if (!open && !isSettlingAll) {
            setShowConfirmSettleAll(false);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Settle all transactions?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark all transactions as settled. Ensure everyone has
              actually paid what they owe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSettlingAll}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSettleAllTransactions}
              disabled={isSettlingAll}
              className="bg-green-600 hover:bg-green-700 focus:ring-green-600 dark:bg-green-700 dark:hover:bg-green-800 dark:focus:ring-green-700"
            >
              {isSettlingAll ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Settling All...
                </div>
              ) : (
                "Settle All"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
