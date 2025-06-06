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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GenAILiveClient } from '../../lib/genai-live-client';
import { LiveConnectConfig } from '@google/genai';
import { AudioStreamer } from '../../lib/audio-streamer';
import { audioContext } from '../../lib/utils';
import VolMeterWorket from '../../lib/worklets/vol-meter';
import { DEFAULT_LIVE_API_MODEL } from '../../lib/constants';

export interface UseLiveApiResults {
  client: GenAILiveClient;
  config: LiveConnectConfig | undefined;
  setConfig: (config: LiveConnectConfig) => void;
  connect: () => Promise<void>;
  connected: boolean;
  disconnect: () => Promise<void>;
  volume: number;
  audioContext?: AudioContext;
}

interface UseLiveApiProps {
  apiKey: string;
  model?: string;
  audioStreamer?: AudioStreamer | null;
}

export function useLiveApi({
  apiKey,
  model = DEFAULT_LIVE_API_MODEL,
  audioStreamer: externalAudioStreamer,
}: UseLiveApiProps): UseLiveApiResults {
  const client = useMemo(() => new GenAILiveClient(apiKey, model), [apiKey, model]);
  const [volume, setVolume] = useState(0);
  const [connected, setConnected] = useState(false);
  const [config, setConfig] = useState<LiveConnectConfig>();
  
  const audioStreamerRef = useRef<AudioStreamer | null>(null);

  // Initialize audio if not provided externally
  useEffect(() => {
    if (externalAudioStreamer) {
      audioStreamerRef.current = externalAudioStreamer;
    } else {
      const initAudio = async () => {
        try {
          const ctx = await audioContext({ id: 'audio-out' });
          audioStreamerRef.current = new AudioStreamer(ctx);
          await audioStreamerRef.current.addWorklet('vumeter-out', VolMeterWorket, (ev: any) => {
            setVolume(ev.data.volume);
          });
        } catch (err) {
          console.error('Error initializing audio:', err);
        }
      };
      initAudio();
    }
  }, [externalAudioStreamer]);

  useEffect(() => {
    const onOpen = () => setConnected(true);
    const onClose = () => setConnected(false);

    const stopAudioStreamer = () => {
      if (audioStreamerRef.current) {
        audioStreamerRef.current.stop();
      }
    };

    const onAudio = (data: ArrayBuffer) => {
      if (audioStreamerRef.current) {
        audioStreamerRef.current.addPCM16(new Uint8Array(data));
      }
    };

    client.on('open', onOpen);
    client.on('close', onClose);
    client.on('interrupted', stopAudioStreamer);
    client.on('audio', onAudio);

    return () => {
      client.off('open', onOpen);
      client.off('close', onClose);
      client.off('interrupted', stopAudioStreamer);
      client.off('audio', onAudio);
    };
  }, [client]);

  const connect = useCallback(async () => {
    if (!config) {
      throw new Error('config has not been set');
    }
    client.disconnect();
    await client.connect(config);
  }, [client, config]);

  const disconnect = useCallback(async () => {
    client.disconnect();
    setConnected(false);
  }, [client]);

  return {
    client,
    config,
    setConfig,
    connect,
    connected,
    disconnect,
    volume,
    audioContext: audioStreamerRef.current?.context,
  };
}
