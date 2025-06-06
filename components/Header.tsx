/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useLiveAPIContext } from '@/contexts/LiveAPIContext';
import { Agent, createNewAgent } from '@/lib/presets/agents';
import { useAgent, useUI, useUser } from '@/lib/state';
import c from 'classnames';
import { useEffect, useRef, useState } from 'react';

export default function Header() {
  const { showUserConfig, setShowUserConfig, setShowAgentEdit } = useUI();
  const { name } = useUser();
  const { current, setCurrent, availablePresets, availablePersonal, addAgent } =
    useAgent();
  const { disconnect } = useLiveAPIContext();

  const [showRoomList, setShowRoomList] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      // Close menu if clicking outside
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setShowRoomList(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setShowRoomList(false);
      }
    }

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleAgentChange = (agent: Agent) => {
    disconnect();
    setCurrent(agent);
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
          <h1 className="app-title">
            <span className="material-symbols-outlined">smart_toy</span>
            Gemini Chat
          </h1>
          <button
            ref={buttonRef}
            className="mobile-menu-button"
            onClick={(e) => {
              e.stopPropagation();
              setShowRoomList(!showRoomList);
            }}
            aria-expanded={showRoomList}
            aria-label="Toggle agent menu"
          >
            <span className="material-symbols-outlined">
              {showRoomList ? 'close' : 'menu'}
            </span>
          </button>
        </div>

        <nav
          ref={menuRef}
          className={c('agent-menu', { show: showRoomList })}
          aria-hidden={!showRoomList}
        >
          <div className="agent-list">
            {availablePresets.map((agent) => (
              <button
                key={agent.id}
                className={c('agent-button', { active: current.id === agent.id })}
                onClick={() => handleAgentChange(agent)}
              >
                {agent.name}
              </button>
            ))}
            {availablePersonal.map((agent) => (
              <button
                key={agent.id}
                className={c('agent-button', { active: current.id === agent.id })}
                onClick={() => handleAgentChange(agent)}
              >
                {agent.name}
              </button>
            ))}
            <button
              className="agent-button create-agent"
              onClick={handleCreateAgent}
            >
              <span className="material-symbols-outlined">add</span>
              New Agent
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
