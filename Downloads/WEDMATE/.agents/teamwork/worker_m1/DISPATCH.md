## 2026-11-04T10:59:33Z
You are a Worker subagent (worker_m1).
Working directory: C:\Users\LENOVO\.gemini\antigravity\scratch\WEDMATE\.agents\teamwork\worker_m1\
Project root: C:\Users\LENOVO\.gemini\antigravity\scratch\WEDMATE\

Mandatory initial step:
Read C:\Users\LENOVO\.gemini\antigravity\scratch\WEDMATE\.agents\teamwork\ORIGINAL_REQUEST.md, specifically the section dated 2026-11-04T10:34:22Z.
Also read C:\Users\LENOVO\.gemini\antigravity\scratch\WEDMATE\.agents\teamwork\orchestrator_2\PROJECT.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Exclusive Write Ownership:
- `lib/demo-store.ts`
- `app/customer/checklist/page.tsx`
- `lib/auth-context.tsx`
- `app/approval-pending/page.tsx`

Tasks:
1. In `app/customer/checklist/page.tsx` line 114:
   Change `setTasks(demoStore.getTasks(currentProject.id));` to `setTasks(demoStore.getTasksByProjectId(currentProject.id));`.
2. In `lib/demo-store.ts`:
   Add a clean, typed alias:
   ```typescript
   public getTasks(projectId: string): WeddingTask[] {
     return this.getTasksByProjectId(projectId);
   }
   ```
3. In `lib/auth-context.tsx`:
   - In `syncAuthCookies()`: Write both `wedmate_user_role` and `wedmate_role`, as well as `wedmate_user_status` and `wedmate_status`, so `middleware.ts` and server layout guards are 100% synchronized in browser demo mode.
   - Update client router pushes:
     - For APPROVED CUSTOMER: push directly to `/customer/booking` (replace any `/customer/dashboard` targets).
     - For ADMIN: push directly to `/admin/approvals` (replace any `/admin` targets).
4. In `app/approval-pending/page.tsx`:
   Update line 154 reference from `/admin/dashboard/approvals` to `/admin/approvals`.
5. Verify your changes and ensure no syntax or type errors are introduced.
6. Write a complete handoff report following the Handoff Protocol to:
   `C:\Users\LENOVO\.gemini\antigravity\scratch\WEDMATE\.agents\teamwork\worker_m1\handoff.md`
   and notify the orchestrator with send_message.
