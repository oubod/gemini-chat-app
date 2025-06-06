/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useLiveAPIContext } from '@/contexts/LiveAPIContext';
import { Agent, createNewAgent } from '@/lib/presets/agents';
import { useAgent, useUI, useUser } from '@/lib/state';
import c from 'classnames';
import { useEffect, useState } from 'react';

export default function Header() {
  const { showUserConfig, setShowUserConfig, setShowAgentEdit } = useUI();
  const { name } = useUser();
  const { current, setCurrent, availablePresets, availablePersonal, addAgent } =
    useAgent();
  const { disconnect } = useLiveAPIContext();

  const [showRoomList, setShowRoomList] = useState(false);

  useEffect(() => {
    const handleClick = () => setShowRoomList(false);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleAgentChange = (agentId: string) => {
    disconnect();
    setCurrent(agentId);
    setShowRoomList(false);
  };

  const handleCreateAgent = () => {
    const newAgent = createNewAgent();
    addAgent(newAgent);
    setCurrent(newAgent.id);
    setShowAgentEdit(true);
    setShowRoomList(false);
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <button
            className="mobile-menu-button"
            onClick={(e) => {
              e.stopPropagation();
              setShowRoomList(!showRoomList);
            }}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1 className="header-title">Gemini Chat</h1>
        </div>

        <nav className={c('agent-selector', { 'open': showRoomList })}>
          <div className="agent-list">
            {availablePresets.map((agent) => (
              <button
                key={agent.id}
                className={c('agent-item', { 'active': current === agent.id })}
                onClick={() => handleAgentChange(agent.id)}
              >
                {agent.name}
              </button>
            ))}
            {availablePersonal.map((agent) => (
              <button
                key={agent.id}
                className={c('agent-item', { 'active': current === agent.id })}
                onClick={() => handleAgentChange(agent.id)}
              >
                {agent.name}
              </button>
            ))}
            <button
              className="agent-item create-agent"
              onClick={handleCreateAgent}
            >
              <span className="material-symbols-outlined">add</span>
              New Agent
            </button>
          </div>
        </nav>

        <div className="header-right">
          <button
            className="user-button"
            onClick={() => setShowUserConfig(!showUserConfig)}
          >
            <span className="material-symbols-outlined">account_circle</span>
            <span className="user-name">{name}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
