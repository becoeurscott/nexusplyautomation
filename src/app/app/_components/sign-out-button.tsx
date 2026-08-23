"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { signOut } from "@/lib/auth-client";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const router = useRouter();
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.12 }}
      onClick={async () => {
        await signOut();
        router.push("/");
      }}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-red-400 transition-colors duration-150 hover:bg-red-500/10"
    >
      <LogOut className="h-4 w-4" />
      Log out
    </motion.button>
  );
}
