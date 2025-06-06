/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { create } from 'zustand';
import { Agent, createNewAgent } from './presets/agents';

/**
 * User
 */
export type User = {
  name?: string;
  info?: string;
};

export const useUser = create<
  {
    setName: (name: string) => void;
    setInfo: (info: string) => void;
  } & User
>(set => ({
  name: '',
  info: '',
  setName: name => set({ name }),
  setInfo: info => set({ info }),
}));

/**
 * Agents
 */
function getAgentById(id: string) {
  const { availablePersonal, availablePresets } = useAgent.getState();
  return (
    availablePersonal.find(agent => agent.id === id) ||
    availablePresets.find(agent => agent.id === id)
  );
}

export const useAgent = create<{
  current: Agent;
  availablePresets: Agent[];
  availablePersonal: Agent[];
  setCurrent: (agent: Agent | string) => void;
  addAgent: (agent: Agent) => void;
  update: (agentId: string, adjustments: Partial<Agent>) => void;
}>(set => ({
  current: createNewAgent({
    id: 'obeida',
    name: 'عبيدة',
    personality: 'أهلاً! 👋 أنا روبوت دردشة مميز ومصمم خصيصًا على ذوقك 👨‍⚕️🎮 \n أنا الطبيب الـGamer في عالم الذكاء الاصطناعي! أدمج بين دقة الطب ومتعة اللعب، وأقدم لك مساعدة ذكية في كل ما يخص طب القلب، تخطيط القلب، الإيكو، القسطرة، واختيار العلاج الأمثل — كل ذلك بأسلوب خفيف وسلس... بدون ملل وبدون إنترنت! \n \n 🚑 مستعجل؟ عندك حالة في الـSemi-USIC؟ محتار في تحليل نتيجة أو تريد تفسير صورة إيكو؟ \n 🎧 أو فقط تحتاج ملخص سريع صباحي لأحدث أخبار أمراض القلب؟ \n أنا معك، 24/7، بنفس حماسك لما تفوز راوند في Call of Duty! 💥 \n \n 📱 أحب التطبيقات الذكية، أشتغل تمامًا في وضع الظلام (Dark Mode)، أنيق وسلس على الجوال \n 🧠 ذاكرتي مليانة بيانات طبية، بروتوكولات علاجية، وحيل يومية تنفعك كطبيب في الخط الأمامي \n 🎯 وأهم شيء... ما أنسى إني Gamer، فاستعد لبعض المفاجآت التفاعلية قريبًا!',
    bodyColor: '#4285f4',
    voice: 'Charon'
  }),
  availablePresets: [],
  availablePersonal: [],

  addAgent: (agent: Agent) => {
    set(state => ({
      availablePersonal: [...state.availablePersonal, agent],
      current: agent,
    }));
  },
  setCurrent: (agent: Agent | string) =>
    set({ current: typeof agent === 'string' ? getAgentById(agent) : agent }),
  update: (agentId: string, adjustments: Partial<Agent>) => {
    let agent = getAgentById(agentId);
    if (!agent) return;
    const updatedAgent = { ...agent, ...adjustments };
    set(state => ({
      availablePresets: state.availablePresets.map(a =>
        a.id === agentId ? updatedAgent : a
      ),
      availablePersonal: state.availablePersonal.map(a =>
        a.id === agentId ? updatedAgent : a
      ),
      current: state.current.id === agentId ? updatedAgent : state.current,
    }));
  },
}));

/**
 * UI
 */
export const useUI = create<{
  showUserConfig: boolean;
  setShowUserConfig: (show: boolean) => void;
  showAgentEdit: boolean;
  setShowAgentEdit: (show: boolean) => void;
}>(set => ({
  showUserConfig: true,
  setShowUserConfig: (show: boolean) => set({ showUserConfig: show }),
  showAgentEdit: false,
  setShowAgentEdit: (show: boolean) => set({ showAgentEdit: show }),
}));
