"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Coins, Send } from "lucide-react";

/**
 * The top bar used to hold Search, Share, Invite, a notification bell and a
 * dropdown chevron — none of which were wired to anything. Clicking them did
 * nothing, which reads as "the app is broken" rather than "not built yet".
 *
 * It now carries one action that works and one number worth glancing at.
 */
export function TopBarActions({
  initials,
  name,
  email,
  balance,
}: {
  initials: string;
  name: string;
  email: string;
  balance: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <Link href="/app/compose">
        <motion.span
          whileTap={{ scale: 0.96 }}
          transition={{ duration: 0.12 }}
          className="flex items-center gap-2 rounded-full bg-[color:var(--nx-blue)] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[color:var(--nx-blue-hover)]"
        >
          <Send className="h-4 w-4" /> Create post
        </motion.span>
      </Link>

      <Link
        href="/app/settings"
        title="Credits left"
        className="hidden items-center gap-1.5 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:flex"
      >
        <Coins className="h-4 w-4 text-slate-400" />
        {balance}
        <span className="text-slate-500">credits</span>
      </Link>

      <div className="ml-1 flex items-center gap-2 py-1 pl-1 pr-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#dbeafe] text-xs font-bold text-[#1d4ed8]">
          {initials}
        </span>
        <div className="hidden leading-tight sm:block">
          <div className="text-sm font-semibold">{name}</div>
          <div className="text-[11px] text-slate-500">{email}</div>
        </div>
      </div>
    </div>
  );
}
