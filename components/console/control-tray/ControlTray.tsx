/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import cn from 'classnames';
import { memo, ReactNode, useEffect, useRef, useState } from 'react';
import { AudioRecorder } from '../../../lib/audio-recorder';

import { useLiveAPIContext } from '../../../contexts/LiveAPIContext';
import { useUI } from '@/lib/state';

export type ControlTrayProps = {
  children?: ReactNode;
};

function ControlTray({ children }: ControlTrayProps) {
  const [audioRecorder] = useState(() => new AudioRecorder());
  const [muted, setMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const connectButtonRef = useRef<HTMLButtonElement>(null);

  const { showAgentEdit, showUserConfig } = useUI();
  const { client, connected, connect, disconnect, audioContext } = useLiveAPIContext();

  // Stop current agent if editing agent or user config
  useEffect(() => {
    if (showAgentEdit || showUserConfig) {
      if (connected) disconnect();
    }
  }, [showUserConfig, showAgentEdit, connected, disconnect]);

  // Auto-focus connect button when disconnected
  useEffect(() => {
    if (!connected && connectButtonRef.current) {
      connectButtonRef.current.focus();
    }
  }, [connected]);

  // Handle audio recording
  useEffect(() => {
    const onData = (base64: string) => {
      if (connected && !muted) {
        client.sendRealtimeInput([
          {
            mimeType: 'audio/pcm;rate=16000',
            data: base64,
          },
        ]);
      }
    };

    const onError = (err: Error) => {
      console.error('Audio recording error:', err);
      setMuted(true);
      setIsRecording(false);
    };

    audioRecorder.on('data', onData);
    audioRecorder.on('error', onError);

    return () => {
      audioRecorder.off('data', onData);
      audioRecorder.off('error', onError);
    };
  }, [connected, client, muted, audioRecorder]);

  // Handle recording state
  useEffect(() => {
    const startRecording = async () => {
      try {
        if (connected && !muted && audioContext?.state === 'running') {
          await audioRecorder.start();
          setIsRecording(true);
        }
      } catch (err) {
        console.error('Failed to start recording:', err);
        setMuted(true);
        setIsRecording(false);
      }
    };

    if (connected && !muted) {
      startRecording();
    } else {
      audioRecorder.stop();
      setIsRecording(false);
    }
  }, [connected, muted, audioRecorder, audioContext]);

  const handleMicToggle = () => {
    setMuted(!muted);
  };

  const handleConnectionToggle = async () => {
    if (connected) {
      disconnect();
    } else {
      try {
        await connect();
      } catch (err) {
        console.error('Connection error:', err);
      }
    }
  };

  return (
    <section className="control-tray">
      <nav className={cn('actions-nav', { disabled: !connected })}>
        <button
          className={cn('action-button mic-button', { active: !muted && isRecording })}
          onClick={handleMicToggle}
          disabled={!connected}
          title={muted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {!muted ? (
            <span className="material-symbols-outlined filled">
              {isRecording ? 'mic' : 'mic_none'}
            </span>
          ) : (
            <span className="material-symbols-outlined filled">mic_off</span>
          )}
        </button>
        {children}
      </nav>

      <div className={cn('connection-container', { connected })}>
        <div className="connection-button-container">
          <button
            ref={connectButtonRef}
            className="connection-button"
            onClick={handleConnectionToggle}
          >
            {connected ? 'Disconnect' : 'Connect'}
          </button>
        </div>
      </div>
    </section>
  );
}

export default memo(ControlTray);
