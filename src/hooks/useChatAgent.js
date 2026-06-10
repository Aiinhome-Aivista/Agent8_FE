import { useState } from 'react';
import { aiAgentService } from '../services/aiAgentService';

export const useChatAgent = () => {
  const [agentState, setAgentState] = useState('idle');

  const invokeAgent = async (message) => {
    setAgentState('processing');
    // Call the standard chat endpoint, which is now backed by SupervisorAgent
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ message })
    });
    const data = await response.json();
    setAgentState('idle');
    return data;
  };

  return { agentState, invokeAgent };
};
