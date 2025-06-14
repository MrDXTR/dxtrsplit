"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "~/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { GroupSummary } from "~/app/_components/GroupSummary";
import { use } from "react";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { GroupMembers } from "~/app/_components/group/GroupMembers";

export default function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const utils = api.useUtils();
  const [showMembersDialog, setShowMembersDialog] = useState(false);

  const { data: group, isLoading: isLoadingGroup } = api.group.getById.useQuery(
    resolvedParams.id,
  );

  const { data: balances, isLoading: isLoadingBalances } =
    api.expense.getBalances.useQuery(resolvedParams.id, {
      enabled: !!group,
    });

  const handleExpenseCreated = async () => {
    await utils.group.getById.invalidate(resolvedParams.id);
    await utils.expense.getBalances.invalidate(resolvedParams.id);
  };

  if (isLoadingGroup) {
    return (
      <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 dark:bg-gray-900/50">
        <div className="container mx-auto max-w-7xl space-y-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
          >
            <div className="space-y-2">
              <Skeleton className="h-10 w-64 dark:bg-gray-800" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-32 dark:bg-gray-800" />
                <Skeleton className="h-4 w-32 dark:bg-gray-800" />
              </div>
            </div>
            <Skeleton className="h-12 w-40 dark:bg-gray-800" />
          </motion.div>

          <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
            <Card className="h-full border-0 bg-white/80 shadow-xl backdrop-blur-sm dark:bg-gray-800/80 dark:shadow-gray-900/30">
              <CardHeader className="pb-4">
                <Skeleton className="h-8 w-48 dark:bg-gray-700" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-6 w-3/4 dark:bg-gray-700" />
                    <Skeleton className="h-4 w-1/2 dark:bg-gray-700" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="h-full border-0 bg-white/80 shadow-xl backdrop-blur-sm dark:bg-gray-800/80 dark:shadow-gray-900/30">
              <CardHeader className="pb-4">
                <Skeleton className="h-8 w-48 dark:bg-gray-700" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-6 w-3/4 dark:bg-gray-700" />
                    <Skeleton className="h-4 w-1/2 dark:bg-gray-700" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!group) return null;

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 dark:bg-gray-900/50">
      <div className="container mx-auto max-w-7xl space-y-8">
        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GroupSummary
            group={group}
            onExpenseCreated={handleExpenseCreated}
            setShowMembersDialog={setShowMembersDialog}
          />
        </motion.div>
      </div>

      {/* Members Dialog */}
      <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Group Members</DialogTitle>
          </DialogHeader>

          <GroupMembers group={group} isOwner={group.isOwner} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
