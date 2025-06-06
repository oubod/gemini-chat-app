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

import React, { createContext, FC, ReactNode, useContext, useEffect, useRef } from 'react';
import { AudioStreamer } from '../lib/audio-streamer';
import { useLiveApi, UseLiveApiResults } from '../hooks/media/use-live-api';
import { audioContext } from '../lib/utils';

const LiveAPIContext = createContext<UseLiveApiResults | undefined>(undefined);

export type LiveAPIProviderProps = {
  children: ReactNode;
  apiKey: string;
};

export const LiveAPIProvider: FC<LiveAPIProviderProps> = ({
  apiKey,
  children,
}) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioStreamerRef = useRef<AudioStreamer | null>(null);

  // Initialize audio context
  useEffect(() => {
    const initAudio = async () => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = await audioContext();
          audioStreamerRef.current = new AudioStreamer(audioContextRef.current);
        }
      } catch (err) {
        console.error('Failed to initialize audio context:', err);
      }
    };

    const handleInteraction = () => {
      initAudio();
      // Remove event listeners after initialization
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  const {
    client,
    config,
    setConfig,
    connect,
    connected,
    disconnect,
    volume,
  } = useLiveApi({
    apiKey,
    audioStreamer: audioStreamerRef.current,
  });

  return (
    <LiveAPIContext.Provider
      value={{
        client,
        config,
        setConfig,
        connect,
        connected,
        disconnect,
        volume,
        audioContext: audioContextRef.current,
      }}
    >
      {children}
    </LiveAPIContext.Provider>
  );
};

export const useLiveAPIContext = () => {
  const context = useContext(LiveAPIContext);
  if (!context) {
    throw new Error('useLiveAPIContext must be used within a LiveAPIProvider');
  }
  return context;
};
