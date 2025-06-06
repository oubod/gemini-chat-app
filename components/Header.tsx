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

  let [showRoomList, setShowRoomList] = useState(false);

  useEffect(() => {
    addEventListener('click', () => setShowRoomList(false));
    return () => removeEventListener('click', () => setShowRoomList(false));
  }, []);

  function changeAgent(agent: Agent | string) {
    disconnect();
    setCurrent(agent);
  }

  function addNewChatterBot() {
    disconnect();
    addAgent(createNewAgent());
    setShowAgentEdit(true);
  }

  return (
    <header className="header">
      <div className="header-content container">
        <div className="header-left">
          <button
            className="mobile-menu-button"
            onClick={e => {
              e.stopPropagation();
              setShowRoomList(!showRoomList);
            }}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1 className="header-title">Gemini Chat</h1>
        </div>

        <nav className={c('nav-menu', { 'nav-menu-open': showRoomList })}>
          {availablePresets.map(agent => (
            <button
              key={agent.id}
              className={c('nav-item', { active: current === agent.id })}
              onClick={() => changeAgent(agent.id)}
            >
              {agent.name}
            </button>
          ))}
          {availablePersonal.map(agent => (
            <button
              key={agent.id}
              className={c('nav-item', { active: current === agent.id })}
              onClick={() => changeAgent(agent.id)}
            >
              {agent.name}
            </button>
          ))}
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
