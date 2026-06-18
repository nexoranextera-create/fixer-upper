import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/dashboard/Bits";
import { FileText, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/dashboard/medecin/records")({ component: Records });

function Records() {
  return (
    <div className="space-y-5">
      <PageHeader kicker="Medical records" title="Confidential health files" subtitle="End-to-end encrypted records — accessible only by the occupational doctor." />
      <Panel label="STATUS" title="Records vault">
        <div className="flex items-center gap-3 py-3">
          <div className="w-10 h-10 rounded-xl bg-secondary grid place-items-center"><ShieldCheck className="w-4 h-4 text-accent"/></div>
          <div>
            <div className="text-sm font-medium">All records encrypted at rest</div>
            <div className="text-xs text-muted-foreground">AES-256 · Access logged in audit trail.</div>
          </div>
        </div>
      </Panel>
      <Panel label="QUEUE" title="Awaiting review">
        <div className="text-xs text-muted-foreground py-4 flex items-center gap-2">
          <FileText className="w-3.5 h-3.5" /> No new sick-leave certificates this week.
        </div>
      </Panel>
    </div>
  );
}
