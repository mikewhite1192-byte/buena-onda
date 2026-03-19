import { WorkflowPlan } from "@/lib/ai/brain";

export async function executePlan(plan: WorkflowPlan, _ctx: { contactId: string }) {
  for (const step of plan.steps) {
    try {
      switch (step.type) {
        default:
          console.info(`Skipping unsupported step type: ${step.type}`);
          break;
      }
    } catch (error) {
      console.error(`Failed to execute step ${step.type}`, error);
    }
  }
}
