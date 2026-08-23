import { redirect } from "next/navigation";
import { requireWorkspace } from "@/lib/workspace";
import { zernioForWorkspace } from "@/lib/zernio/for-workspace";
import { rows, str } from "@/app/app/_lib/normalize";
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
      accounts = rows(await client.accounts.list(), "accounts")
        .map((r) => {
          const id = str(r, "id", "_id");
          if (!id) return null;
          return {
            id,
            name: str(r, "name", "username", "handle") ?? id,
            platform: str(r, "platform", "provider") ?? "unknown",
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
