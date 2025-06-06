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

import {
  createWorketFromSrc,
  registeredWorklets,
} from './audioworklet-registry';

export class AudioStreamer {
  private sampleRate: number = 24000;
  private bufferSize: number = 7680;
  // A queue of audio buffers to be played. Each buffer is a Float32Array.
  private audioQueue: Float32Array[] = [];
  private isPlaying: boolean = false;
  // Indicates if the stream has finished playing, e.g., interrupted.
  private isStreamComplete: boolean = false;
  private checkInterval: number | null = null;
  private scheduledTime: number = 0;
  private initialBufferTime: number = 0.1; //0.1 // 100ms initial buffer
  // Web Audio API nodes. source => gain => destination
  public gainNode: GainNode;
  public source: AudioBufferSourceNode;
  private endOfQueueAudioSource: AudioBufferSourceNode | null = null;
  private lastPlayAttempt: number = 0;
  private readonly RETRY_INTERVAL = 1000; // 1 second

  public onComplete = () => {};

  constructor(public context: AudioContext) {
    this.gainNode = this.context.createGain();
    this.source = this.context.createBufferSource();
    this.gainNode.connect(this.context.destination);
    this.addPCM16 = this.addPCM16.bind(this);
  }

  private async ensureContextRunning() {
    if (this.context.state === 'suspended') {
      try {
        await this.context.resume();
        return true;
      } catch (err) {
        console.error('Failed to resume audio context:', err);
        return false;
      }
    }
    return true;
  }

  public async addWorklet<T extends (d: any) => void>(
    workletName: string,
    workletSrc: string,
    handler: T
  ): Promise<this> {
    let workletsRecord = registeredWorklets.get(this.context);
    
    if (workletsRecord?.[workletName]) {
      // Worklet exists, add new handler
      workletsRecord[workletName].handlers.push(handler);
      return this;
    }

    if (!workletsRecord) {
      registeredWorklets.set(this.context, {});
      workletsRecord = registeredWorklets.get(this.context)!;
    }

    // Create new record
    workletsRecord[workletName] = { handlers: [handler] };

    const src = createWorketFromSrc(workletName, workletSrc);
    await this.context.audioWorklet.addModule(src);
    const worklet = new AudioWorkletNode(this.context, workletName);

    //add the node into the map
    workletsRecord[workletName].node = worklet;

    return this;
  }

  async addPCM16(chunk: Uint8Array) {
    if (!await this.ensureContextRunning()) {
      return;
    }

    // Reset stream complete flag when new chunk arrives
    this.isStreamComplete = false;
    
    try {
      // Process chunk into Float32Array
      const processingBuffer = this._processPCM16Chunk(chunk);
      
      // Split into buffer-sized chunks
      for (let i = 0; i < processingBuffer.length; i += this.bufferSize) {
        const buffer = processingBuffer.slice(i, i + this.bufferSize);
        this.audioQueue.push(buffer);
      }

      // Start playing if not already
      if (!this.isPlaying) {
        this.isPlaying = true;
        this.scheduledTime = this.context.currentTime + this.initialBufferTime;
        await this.scheduleNextBuffer();
      }
    } catch (err) {
      console.error('Error processing audio chunk:', err);
    }
  }

  /**
   * Converts a Uint8Array of PCM16 audio data into a Float32Array.
   * PCM16 is a common raw audio format, but the Web Audio API generally
   * expects audio data as Float32Arrays with samples normalized between -1.0 and 1.0.
   * This function handles that conversion.
   * @param chunk The Uint8Array containing PCM16 audio data.
   * @returns A Float32Array representing the converted audio data.
   */
  private _processPCM16Chunk(chunk: Uint8Array): Float32Array {
    const float32Array = new Float32Array(chunk.length / 2);
    const dataView = new DataView(chunk.buffer);

    for (let i = 0; i < chunk.length / 2; i++) {
      try {
        const int16 = dataView.getInt16(i * 2, true);
        float32Array[i] = int16 / 32768;
      } catch (e) {
        console.error('Error processing PCM chunk:', e);
      }
    }
    return float32Array;
  }

  private createAudioBuffer(audioData: Float32Array): AudioBuffer {
    const audioBuffer = this.context.createBuffer(
      1,
      audioData.length,
      this.sampleRate
    );
    audioBuffer.getChannelData(0).set(audioData);
    return audioBuffer;
  }

  private async scheduleNextBuffer() {
    if (!this.isPlaying) return;

    const SCHEDULE_AHEAD_TIME = 0.2;

    while (
      this.audioQueue.length > 0 &&
      this.scheduledTime < this.context.currentTime + SCHEDULE_AHEAD_TIME
    ) {
      try {
        const audioData = this.audioQueue.shift()!;
        const audioBuffer = this.createAudioBuffer(audioData);
        const source = this.context.createBufferSource();

        if (this.audioQueue.length === 0) {
          if (this.endOfQueueAudioSource) {
            this.endOfQueueAudioSource.onended = null;
          }
          this.endOfQueueAudioSource = source;
          source.onended = () => {
            if (
              !this.audioQueue.length &&
              this.endOfQueueAudioSource === source
            ) {
              this.endOfQueueAudioSource = null;
              this.onComplete();
            }
          };
        }

        source.buffer = audioBuffer;
        source.connect(this.gainNode);
        
        // Connect worklets
        const worklets = registeredWorklets.get(this.context);
        if (worklets) {
          Object.entries(worklets).forEach(([workletName, graph]) => {
            const { node, handlers } = graph;
            if (node) {
              source.connect(node);
              node.port.onmessage = function (ev: MessageEvent) {
                handlers.forEach(handler => handler.call(node.port, ev));
              };
              node.connect(this.context.destination);
            }
          });
        }

        // Ensure we never schedule in the past
        const startTime = Math.max(this.scheduledTime, this.context.currentTime);
        source.start(startTime);
        this.scheduledTime = startTime + audioBuffer.duration;
      } catch (err) {
        console.error('Error scheduling audio buffer:', err);
      }
    }

    // Set up next schedule check
    if (this.audioQueue.length === 0) {
      if (this.isStreamComplete) {
        this.isPlaying = false;
        if (this.checkInterval) {
          clearInterval(this.checkInterval);
          this.checkInterval = null;
        }
      } else if (!this.checkInterval) {
        this.checkInterval = window.setInterval(() => {
          if (this.audioQueue.length > 0) {
            this.scheduleNextBuffer();
          }
        }, 100) as unknown as number;
      }
    } else {
      const nextCheckTime = (this.scheduledTime - this.context.currentTime) * 1000;
      setTimeout(
        () => this.scheduleNextBuffer(),
        Math.max(0, nextCheckTime - 50)
      );
    }
  }

  stop() {
    this.isPlaying = false;
    this.isStreamComplete = true;
    this.audioQueue = [];
    this.scheduledTime = this.context.currentTime;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    this.gainNode.gain.linearRampToValueAtTime(
      0,
      this.context.currentTime + 0.1
    );

    setTimeout(() => {
      this.gainNode.disconnect();
      this.gainNode = this.context.createGain();
      this.gainNode.connect(this.context.destination);
    }, 200);
  }

  async resume() {
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
    this.isStreamComplete = false;
    this.scheduledTime = this.context.currentTime + this.initialBufferTime;
    this.gainNode.gain.setValueAtTime(1, this.context.currentTime);
  }

  complete() {
    this.isStreamComplete = true;
    this.onComplete();
  }
}

// // Usage example:
// const audioStreamer = new AudioStreamer();
//
// // In your streaming code:
// function handleChunk(chunk: Uint8Array) {
//   audioStreamer.handleChunk(chunk);
// }
//
// // To start playing (call this in response to a user interaction)
// await audioStreamer.resume();
//
// // To stop playing
// // audioStreamer.stop();
