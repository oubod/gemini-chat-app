import { FC } from 'react';
import c from 'classnames';

interface MessageProps {
  content: string;
  isUser?: boolean;
  avatar?: string;
  agentName?: string;
  timestamp?: string;
}

const Message: FC<MessageProps> = ({ content, isUser, avatar, agentName, timestamp }) => {
  return (
    <div className={c('message-wrapper', { user: isUser })}>
      <div className="message-content-wrapper">
        {!isUser && (
          <div className="agent-avatar">
            <span className="material-symbols-outlined">smart_toy</span>
          </div>
        )}
        <div className="message-bubble">
          {!isUser && agentName && <div className="agent-name">{agentName}</div>}
          <div className="message">{content}</div>
          {timestamp && <div className="message-timestamp">{timestamp}</div>}
        </div>
      </div>
    </div>
  );
};

export default Message;
