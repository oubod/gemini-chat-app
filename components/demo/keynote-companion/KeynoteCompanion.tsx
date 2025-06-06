/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useEffect, useRef } from 'react';
import { Modality } from '@google/genai';

import BasicFace from '../basic-face/BasicFace';
import { useLiveAPIContext } from '../../../contexts/LiveAPIContext';
import { createSystemInstructions } from '@/lib/prompts';
import { useAgent, useUser } from '@/lib/state';

export default function KeynoteCompanion() {
  const { client, connected, setConfig } = useLiveAPIContext();
  const faceCanvasRef = useRef<HTMLCanvasElement>(null);
  const user = useUser();
  const { current } = useAgent();
  const hasGreeted = useRef(false);

  // Set the configuration for the Live API
  useEffect(() => {
    setConfig({
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: current.voice },
        },
      },
      systemInstruction: {
        parts: [
          {
            text: createSystemInstructions(current, user),
          },
        ],
      },
    });
  }, [setConfig, user, current]);

  // Send initial greeting when connected
  useEffect(() => {
    const beginSession = async () => {
      if (!connected || hasGreeted.current) return;

      try {
        await client.send(
          {
            text: 'Greet the user and introduce yourself and your role.',
          },
          true
        );
        hasGreeted.current = true;
      } catch (err) {
        console.error('Error sending initial greeting:', err);
        // Reset flag to try again
        hasGreeted.current = false;
      }
    };

    beginSession();
  }, [client, connected]);

  return (
    <div className="keynote-companion">
      <BasicFace canvasRef={faceCanvasRef} color={current.bodyColor} />
    </div>
  );
}
