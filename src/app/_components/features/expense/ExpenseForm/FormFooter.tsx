import { Button } from "~/components/ui/button";
import { ArrowRight, CheckCircle2, ChevronLeft, Loader2 } from "lucide-react";

interface FormFooterProps {
  currentStep: number;
  canContinue: boolean;
  formIsValid: boolean;
  isPending: boolean;
  onBack: () => void;
  onContinue: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function FormFooter({
  currentStep,
  canContinue,
  formIsValid,
  isPending,
  onBack,
  onContinue,
  onSubmit,
}: FormFooterProps) {
  return (
    <div className="rounded-b-lg border-t bg-gray-50/80 p-6 dark:bg-gray-950/80">
      <div className="flex justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="h-10 px-4"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          {currentStep === 1 ? "Cancel" : "Back"}
        </Button>

        {currentStep < 2 ? (
          <Button
            type="button"
            onClick={onContinue}
            disabled={!canContinue}
            className="h-10 bg-gradient-to-r from-violet-500 to-blue-500 px-4 hover:from-violet-600 hover:to-blue-600 dark:text-white"
          >
            Continue
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            onClick={onSubmit}
            disabled={!formIsValid || isPending}
            className="h-10 bg-gradient-to-r from-violet-500 to-blue-500 px-4 hover:from-violet-600 hover:to-blue-600 dark:text-white"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-1 h-4 w-4" />
                Add Expense
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
