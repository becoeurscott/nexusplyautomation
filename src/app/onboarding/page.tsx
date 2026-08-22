import { redirect } from "next/navigation";
import { requireWorkspace } from "@/lib/workspace";
import { zernioForWorkspace } from "@/lib/zernio/for-workspace";
import { OnboardingWizard, type AccountSummary } from "./wizard";

export default async function OnboardingPage() {
  const { workspace } = await requireWorkspace();

  if (workspace.onboardingCompletedAt) {
    redirect("/app");
  }

  const client = await zernioForWorkspace(workspace.id);
  let accounts: AccountSummary[] = [];
  if (client) {
    try {
      const raw = (await client.accounts.list()) as
        | { data?: unknown[] }
        | unknown[];
      const rows = Array.isArray(raw) ? raw : (raw.data ?? []);
      accounts = rows
        .map((r) => {
          if (typeof r !== "object" || r === null) return null;
          const rec = r as Record<string, unknown>;
          const id = typeof rec.id === "string" ? rec.id : null;
          if (!id) return null;
          return {
            id,
            name: typeof rec.name === "string" ? rec.name : id,
            platform: typeof rec.platform === "string" ? rec.platform : "unknown",
          };
        })
        .filter((x): x is AccountSummary => x !== null);
    } catch {
      // Non-fatal — onboarding shows the empty state.
    }
  }

  return (
    <OnboardingWizard
      orgName={workspace.name}
      hasCredential={!!client}
      accounts={accounts}
    />
  );
}
