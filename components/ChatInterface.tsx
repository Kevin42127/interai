'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { setInterviewCooldown } from '@/utils/interviewTimer';
import styles from './ChatInterface.module.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  onReset?: () => void;
  autoStart?: boolean;
}

export default function ChatInterface({ onReset, autoStart = false }: ChatInterfaceProps = {}) {
  const t = useTranslations('ChatInterface');
  const locale = useLocale();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const currentContentRef = useRef<string>('');
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      try {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      } catch (error) {
        // Ignore scroll errors if element is not in DOM
      }
    }
  };

  const autoResizeTextarea = (el: HTMLTextAreaElement) => {
    if (el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 0);
    return () => clearTimeout(timer);
  }, [messages]);

  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
      autoResizeTextarea(inputRef.current);
    }
  }, [isLoading]);

  const handleSend = async (messageContent?: string) => {
    const contentToSend = (typeof messageContent === 'string' ? messageContent.trim() : input.trim());
    if (!contentToSend || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: contentToSend,
      timestamp: new Date(),
    };

    const languageMap: Record<string, string> = {
      'zh-TW': 'zho',
      'en': 'eng',
      'ja': 'jpn',
      'ko': 'kor',
    };
    const languageToUse = languageMap[locale] || 'zho';

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    setIsLoading(true);

    const assistantMessage: Message = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    currentContentRef.current = '';

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api/chat';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          language: languageToUse,
        }),
      });

      if (!response.ok) {
        throw new Error(t('chat.error.requestFailed'));
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error(t('chat.error.cannotReadStream'));
      }

      setIsLoading(false);

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() && line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6).trim();
              if (jsonStr) {
                const data = JSON.parse(jsonStr);
                if (data.content && typeof data.content === 'string') {
                  currentContentRef.current += data.content;
                  
                  const checkInterviewEnd = () => {
                    if (currentContentRef.current.includes('[INTERVIEW_END]')) {
                      const cleanedContent = currentContentRef.current.replace(/\[INTERVIEW_END\]/g, '').trim();
                      currentContentRef.current = cleanedContent;
                      
                      setMessages((prev) => {
                        const newMessages = [...prev];
                        const lastMessage = newMessages[newMessages.length - 1];
                        if (lastMessage && lastMessage.role === 'assistant') {
                          return [
                            ...newMessages.slice(0, -1),
                            {
                              ...lastMessage,
                              content: cleanedContent,
                            },
                          ];
                        }
                        return newMessages;
                      });
                      
                      setTimeout(() => {
                        finishInterview();
                      }, 2000);
                      return true;
                    }
                    return false;
                  };
                  
                  if (!checkInterviewEnd()) {
                    setMessages((prev) => {
                      const newMessages = [...prev];
                      const lastMessage = newMessages[newMessages.length - 1];
                      if (lastMessage && lastMessage.role === 'assistant') {
                        return [
                          ...newMessages.slice(0, -1),
                          {
                            ...lastMessage,
                            content: currentContentRef.current,
                          },
                        ];
                      }
                      return newMessages;
                    });
                  }
                }
              }
            } catch (e) {
              console.error('解析 SSE 資料錯誤:', e, 'Line:', line);
            }
          }
        }
      }
      
      if (currentContentRef.current.includes('[INTERVIEW_END]')) {
        const cleanedContent = currentContentRef.current.replace(/\[INTERVIEW_END\]/g, '').trim();
        currentContentRef.current = cleanedContent;
        
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.role === 'assistant') {
            return [
              ...newMessages.slice(0, -1),
              {
                ...lastMessage,
                content: cleanedContent,
              },
            ];
          }
          return newMessages;
        });
        
        setTimeout(() => {
          finishInterview();
        }, 2000);
      }
    } catch (error) {
      console.error('發送訊息錯誤:', error);
      currentContentRef.current = '';
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          return [
            ...newMessages.slice(0, -1),
            {
              ...lastMessage,
              content: t('chat.error.general'),
            },
          ];
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    autoResizeTextarea(e.target);
  };

  const handleQuickQuestion = (question: string) => {
    if (isLoading) return;
    handleSend(question);
  };

  const finishInterview = () => {
    setCountdown(10);
    
    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          setInterviewCooldown();
          setMessages([]);
          currentContentRef.current = '';
          setInput('');
          if (inputRef.current) {
            inputRef.current.style.height = 'auto';
          }
          if (onReset) {
            onReset();
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (autoStart && messages.length === 0) {
      const welcomeMessage: Message = {
        role: 'assistant',
        content: `${t('interview.welcome')}\n\n${t('interview.privacy')}\n\n${t('interview.finishInfo')}`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [autoStart, messages.length, t]);

  return (
    <div className={styles.chatContainer}>
      {messages.length > 0 && (
        <div className={styles.toolbar}>
          {messages.some(msg => msg.role === 'user') && (
            <button 
              onClick={finishInterview} 
              className={styles.finishButton} 
              disabled={countdown !== null}
              title={countdown === null ? `${t('chat.finishButton')} - ${t('interview.finishInfo')}` : `${t('chat.deleting')} ${countdown}${t('chat.seconds')}`}
            >
              <span className="material-icons">check_circle</span>
              {countdown !== null ? `${t('chat.deleting')} ${countdown}${t('chat.seconds')}` : t('chat.finishButton')}
            </button>
          )}
        </div>
      )}
      <div className={styles.chatMessages}>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`${styles.row} ${message.role === 'user' ? styles.mine : styles.other}`}
          >
            <div className={`${styles.msg} ${message.role === 'user' ? styles.mine : styles.other}`}>
              {message.role === 'assistant' ? (
                <div className={styles.markdown}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                </div>
              ) : (
                message.content
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className={`${styles.row} ${styles.other}`}>
            <div className={`${styles.msg} ${styles.other}`}>
              <div className={styles.typingIndicator}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {messages.length > 0 && (
        <>
          <div className={styles.quickQuestions}>
            <div className={styles.quickQuestionsTitle}>{t('chat.quickQuestions.title')}</div>
            <div className={styles.quickQuestionsList}>
              <button
                className={styles.quickQuestionBtn}
                onClick={() => handleQuickQuestion(t('chat.quickQuestions.interviewProcess'))}
                disabled={isLoading}
              >
                {t('chat.quickQuestions.interviewProcess')}
              </button>
              <button
                className={styles.quickQuestionBtn}
                onClick={() => handleQuickQuestion(t('chat.quickQuestions.technicalStack'))}
                disabled={isLoading}
              >
                {t('chat.quickQuestions.technicalStack')}
              </button>
              <button
                className={styles.quickQuestionBtn}
                onClick={() => handleQuickQuestion(t('chat.quickQuestions.teamStructure'))}
                disabled={isLoading}
              >
                {t('chat.quickQuestions.teamStructure')}
              </button>
              <button
                className={styles.quickQuestionBtn}
                onClick={() => handleQuickQuestion(t('chat.quickQuestions.workContent'))}
                disabled={isLoading}
              >
                {t('chat.quickQuestions.workContent')}
              </button>
            </div>
          </div>
          <div className={styles.composer}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder={t('chat.inputPlaceholder')}
              className={styles.textarea}
              disabled={isLoading}
              rows={1}
            />
            <button
              onClick={() => void handleSend()}
              disabled={!input.trim() || isLoading}
              className={styles.sendButton}
            >
              {t('chat.sendButton')}
            </button>
          </div>
        </>
      )}

    </div>
  );
}
