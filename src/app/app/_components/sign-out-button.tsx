"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await signOut();
        router.push("/");
      }}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50"
    >
      <LogOut className="h-4 w-4" />
      Log out
    </button>
  );
}
