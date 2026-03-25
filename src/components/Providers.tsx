"use client";

import React from "react";
import { Provider } from "react-redux";
import { store } from "@/lib/store";
import { SessionProvider } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Provider store={store}>
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </Provider>
    </SessionProvider>
  );
}
