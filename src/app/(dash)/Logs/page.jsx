"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import LogsProvider from "@/components/LogsProvider";

const LogsSettings = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  React.useEffect(() => {
    // Client-side protection
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (!session) {
    return null; // Don't render anything if not authenticated
  }

  return <LogsProvider />;
};

export default LogsSettings;
