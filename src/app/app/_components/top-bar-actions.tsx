"use client";

import { motion } from "framer-motion";
import { Bell, ChevronDown, Share2, UserPlus } from "lucide-react";

const tap = { scale: 0.94 };
const tapTransition = { duration: 0.12 };

export function TopBarActions({
  initials,
  name,
  email,
}: {
  initials: string;
  name: string;
  email: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <motion.button
        whileTap={tap}
        transition={tapTransition}
        className="hidden items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 md:flex"
      >
        <Share2 className="h-4 w-4" /> Share
      </motion.button>
      <motion.button
        whileTap={tap}
        transition={tapTransition}
        className="flex items-center gap-2 rounded-full bg-[color:var(--nx-blue)] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[color:var(--nx-blue-hover)]"
      >
        <UserPlus className="h-4 w-4" /> Invite
      </motion.button>
      <motion.button
        whileTap={tap}
        transition={tapTransition}
        className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
      >
        <Bell className="h-4 w-4" />
      </motion.button>
      <motion.div
        whileTap={tap}
        transition={tapTransition}
        className="ml-1 flex cursor-pointer items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-slate-50"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[#dbeafe] text-xs font-bold text-[#1d4ed8]">
          {initials}
        </span>
        <div className="hidden leading-tight sm:block">
          <div className="text-sm font-semibold">{name}</div>
          <div className="text-[11px] text-slate-500">{email}</div>
        </div>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </motion.div>
    </div>
  );
}
