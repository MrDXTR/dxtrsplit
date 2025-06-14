"use client";

import { useState } from "react";
import { Plus, X, Users } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";

export function CreateGroupDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [people, setPeople] = useState<string[]>([]);
  const [newPerson, setNewPerson] = useState("");
  const router = useRouter();

  const createGroup = api.group.create.useMutation({
    onSuccess: (data) => {
      setOpen(false);
      setName("");
      setPeople([]);
      setNewPerson("");
      router.push(`/groups/${data.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      createGroup.mutate({ name: name.trim(), people });
    }
  };

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newPerson.trim();
    if (trimmedName && !people.includes(trimmedName)) {
      setPeople([...people, trimmedName]);
      setNewPerson("");
    }
  };

  const handleRemovePerson = (person: string) => {
    setPeople(people.filter((p) => p !== person));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      e.key === "Enter" &&
      newPerson.trim() &&
      !people.includes(newPerson.trim())
    ) {
      e.preventDefault();
      handleAddPerson(e as any);
    }
  };

  const resetForm = () => {
    setName("");
    setPeople([]);
    setNewPerson("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl sm:w-auto dark:text-white"
          size="lg"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create New Group
        </Button>
      </DialogTrigger>
      <DialogContent className="mx-4 max-w-md sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl">Create New Group</DialogTitle>
            <DialogDescription className="text-sm">
              Create a group to start splitting expenses with friends, family,
              or colleagues.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-6">
            {/* Group Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Group Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Weekend Trip, House Expenses"
                className="h-11"
                required
                autoFocus
              />
            </div>

            <Separator />

            {/* Add People Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-600" />
                <Label className="text-sm font-medium">Add People</Label>
                <span className="text-xs text-gray-500">(Optional)</span>
              </div>

              <div className="flex gap-2">
                <Input
                  value={newPerson}
                  onChange={(e) => setNewPerson(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter person's name"
                  className="h-10 flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddPerson}
                  disabled={
                    !newPerson.trim() || people.includes(newPerson.trim())
                  }
                  className="h-10 px-3"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {people.length > 0 && (
                <div className="space-y-3">
                  <div className="text-xs text-gray-600">
                    {people.length} {people.length === 1 ? "person" : "people"}{" "}
                    added
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {people.map((person) => (
                      <Badge
                        key={person}
                        variant="secondary"
                        className="flex items-center gap-1 bg-blue-50 px-2 py-1 text-blue-700 hover:bg-blue-100"
                      >
                        <span className="text-sm">{person}</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePerson(person)}
                          className="ml-1 rounded-full p-0.5 transition-colors hover:bg-blue-200"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="w-full sm:w-auto"
              disabled={createGroup.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createGroup.isPending || !name.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 sm:w-auto dark:text-white"
            >
              {createGroup.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Creating...
                </div>
              ) : (
                "Create Group"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
