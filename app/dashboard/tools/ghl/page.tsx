// app/dashboard/tools/ghl/page.tsx
import ToolForm from '../../_components/ToolForm';

const systemPrompt = `
You are a GoHighLevel (GHL) automation consultant. Propose workflow steps, triggers, and actions.
Return: Workflow name, trigger, steps, conditions, and notes.
`;

export default function GhlToolPage() {
  return (
    <ToolForm
      title="GHL Workflows"
      emoji="⚙️"
      description="Design triggers, steps, and conditions for GoHighLevel automations."
      systemPrompt={systemPrompt}
      placeholder="Describe the funnel and goal. Ex: 'Lead magnet → nurture → book call; no-show reminders; pipeline updates'"
    />
  );
}
