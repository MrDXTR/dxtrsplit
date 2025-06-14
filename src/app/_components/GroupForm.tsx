"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

interface GroupFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function GroupForm({ onClose, onSuccess }: GroupFormProps) {
  const [name, setName] = useState("");
  const [people, setPeople] = useState<string[]>([""]);
  const utils = api.useUtils();

  const createGroup = api.group.create.useMutation({
    onMutate: () => {
      toast.loading("Creating group...", {
        id: "create-group",
      });
    },
    onSuccess: async () => {
      setName("");
      setPeople([""]);
      await utils.group.getAll.invalidate();
      toast.success("Group created successfully", {
        id: "create-group",
      });
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      console.error("Failed to create group:", error);
      toast.error("Failed to create group", {
        id: "create-group",
      });
    },
  });

  const addPerson = () => {
    setPeople([...people, ""]);
  };

  const removePerson = (index: number) => {
    setPeople(people.filter((_, i) => i !== index));
  };

  const updatePerson = (index: number, value: string) => {
    const newPeople = [...people];
    newPeople[index] = value;
    setPeople(newPeople);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validPeople = people.filter((p) => p.trim() !== "");
    if (validPeople.length === 0) return;
    createGroup.mutate({
      name,
      people: validPeople,
    });
  };

  const isFormValid =
    name.trim().length > 0 && people.some((p) => p.trim().length > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className="relative"
    >
      <Card className="border-0 bg-white/90 shadow-2xl shadow-blue-100/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 p-2">
                <Plus className="h-6 w-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent dark:text-white">
                Create New Group
              </span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="groupName"
                className="text-sm font-semibold text-gray-700"
              >
                Group Name *
              </Label>
              <Input
                id="groupName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Trip to Goa, Roommate Expenses, Office Lunch"
                className="h-12 border-gray-200 transition-all duration-200 focus:border-blue-500 focus:ring-blue-500/20"
                autoFocus
                required
              />
              <p className="text-sm text-gray-500">
                Choose a descriptive name for your group
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                People *
              </Label>
              {people.map((person, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex gap-2"
                >
                  <Input
                    value={person}
                    onChange={(e) => updatePerson(index, e.target.value)}
                    placeholder={`Person ${index + 1}`}
                    className="h-12 border-gray-200 transition-all duration-200 focus:border-blue-500 focus:ring-blue-500/20"
                    required
                  />
                  {people.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePerson(index)}
                      className="rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </motion.div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addPerson}
                className="w-full border-gray-200 hover:bg-gray-50"
              >
                Add Person
              </Button>
            </div>

            <Separator />

            <div className="flex flex-col justify-end gap-3 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="order-2 border-gray-300 hover:bg-gray-50 sm:order-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid || createGroup.isPending}
                className={`order-1 sm:order-2 ${
                  isFormValid
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 shadow-lg hover:from-green-700 hover:to-emerald-700 hover:shadow-xl"
                    : "cursor-not-allowed bg-gray-300"
                } transition-all duration-300`}
              >
                {createGroup.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Creating...
                  </div>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Group
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
