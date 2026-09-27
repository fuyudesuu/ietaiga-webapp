"use client";
import { useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { usePlanner } from "@/lib/encore/store";

type Tool = {
  name: string;
  description: string;
  inputSchema: object;
  annotations: { readOnlyHint: boolean };
  execute: (input: unknown) => unknown;
};
type Registry = {
  registerTool: (
    tool: Tool,
    options: { signal: AbortSignal },
  ) => void | Promise<void>;
};

export function WebTools() {
  const planner = usePlanner();
  const latest = useRef(planner);
  latest.current = planner;
  useEffect(() => {
    const registry = (document as Document & { modelContext?: Registry })
      .modelContext;
    if (!registry) return;
    const lifecycle = new AbortController();
    const tools: Tool[] = [
      {
        name: "read_demo_plans",
        description:
          "Read current synthetic concerts and ticket application states from the same store shown in Encore.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true },
        execute(input: unknown) {
          if (
            !input ||
            typeof input !== "object" ||
            Array.isArray(input) ||
            Object.keys(input).length
          )
            throw new Error("Expected an empty object.");
          return {
            demo: true,
            concerts: latest.current.state.concerts,
            applications: latest.current.state.applications,
          };
        },
      },
      {
        name: "record_demo_ticket_payment",
        description:
          "Record a payment as paid for a winning, unpaid sample ticket application. Updates visible summaries; does not charge money.",
        inputSchema: {
          type: "object",
          properties: { applicationId: { type: "string" } },
          required: ["applicationId"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false },
        execute(input: unknown) {
          if (
            !input ||
            typeof input !== "object" ||
            !("applicationId" in input) ||
            typeof input.applicationId !== "string" ||
            Object.keys(input).length !== 1
          )
            throw new Error("An applicationId string is required.");
          const application = latest.current.state.applications.find(
            (a) => a.id === input.applicationId,
          );
          if (!application) throw new Error("Application not found.");
          if (application.result !== "Won" || application.payment !== "Unpaid")
            throw new Error(
              "Only winning, unpaid applications can be marked paid.",
            );
          flushSync(() => {
            latest.current.setApplication(application.id, { payment: "Paid" });
            latest.current.notify(
              "Sample ticket payment recorded. No money was charged.",
            );
          });
          return {
            demo: true,
            applicationId: application.id,
            payment: latest.current.state.applications.find(
              (a) => a.id === application.id,
            )?.payment,
          };
        },
      },
    ];
    for (const tool of tools) {
      try {
        Promise.resolve(
          registry.registerTool(tool, { signal: lifecycle.signal }),
        ).catch(() => {});
      } catch {
        /* Optional browser capability; ordinary UI remains available. */
      }
    }
    return () => lifecycle.abort();
  }, []);
  return null;
}
