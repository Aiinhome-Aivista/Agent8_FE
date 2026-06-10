// Frontend service to interact with the new Agentic backend

export const aiAgentService = {
  getAgentStatus: async () => {
    // Stub for fetching agent status
    return { supervisor: "idle", intent: "idle" };
  },
  
  triggerWorkflow: async (workflowName, payload) => {
    // Stub for triggering a background workflow
    console.log(`Triggered ${workflowName} with`, payload);
  }
};
