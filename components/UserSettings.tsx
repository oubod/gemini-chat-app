/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useUI, useUser } from '@/lib/state';

export default function UserSettings() {
  const { name, info, setName, setInfo } = useUser();
  const { setShowUserConfig } = useUI();

  function updateClient() {
    setShowUserConfig(false);
  }

  return (
    <div className="welcome-screen">
      <div className="welcome-logo">Gemini Chat</div>
      <div className="welcome-card">
        <h1 className="welcome-title">Welcome to Gemini Chat!</h1>
        <p className="welcome-description">
          This is a simple tool that allows you to design, test, and banter with
          custom AI characters on the fly.
        </p>

        <form
          onSubmit={e => {
            e.preventDefault();
            setShowUserConfig(false);
            updateClient();
          }}
        >
          <p className="welcome-description">Tell us about yourself:</p>

          <div className="form-group">
            <label className="form-label">Your name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="What do you like to be called?"
            />
          </div>

          <div className="form-group">
            <label className="form-label">A bit about you</label>
            <textarea
              className="form-input form-textarea"
              value={info}
              onChange={e => setInfo(e.target.value)}
              placeholder="Share your interests, hobbies, favorite movies, books, etc. This helps make our conversation more personalized!"
            />
          </div>

          <button type="submit" className="start-button">
            Let's get started!
          </button>
        </form>
      </div>
    </div>
  );
}
