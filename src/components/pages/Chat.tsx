'use client';

import { ActionIcon, Box, Card, Group, Loader, ScrollArea, Stack, Text, Textarea, Title } from '@mantine/core';
import { IconArrowLeft, IconRobot, IconSend, IconUser } from '@tabler/icons-react';
import clsx from 'clsx';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import { LoadingScreen } from '~/components/screens/LoadingScreen';
import { useAuth } from '~/contexts/auth';
import { agentRef, useAgentDocument } from '~/models/agent';
import { chatWithAgentStream } from '~/utils/api/fetch';
import { notify } from '~/utils/mantine/notifications';
import styles from './_styles/Chat.module.css';
import type { KeyboardEvent } from 'react';
import type { ChatMessage } from '~/utils/api/fetch';

type DisplayMessage = ChatMessage & { id: string };

type ChatProps = {
  agentId: string;
};

export const Chat = ({ agentId }: ChatProps) => {
  const { loading: loadingAuth } = useAuth();
  const { data: agent, loading: loadingAgent } = useAgentDocument(agentRef(agentId));
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
    }, 100);
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: DisplayMessage = { id: crypto.randomUUID(), role: 'user', content: input.trim() };
    const assistantMessageId = crypto.randomUUID();

    // Convert to API format (without id)
    const history: ChatMessage[] = messages.map(({ role, content }) => ({ role, content }));

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);
    scrollToBottom();

    try {
      setMessages((prev) => [...prev, { id: assistantMessageId, role: 'model', content: '' }]);
      await chatWithAgentStream({ agentId, message: userMessage.content, history }, (chunk) => {
        if (!isMountedRef.current) return;
        setMessages((prev) =>
          prev.map((msg) => (msg.id === assistantMessageId ? { ...msg, content: msg.content + chunk } : msg)),
        );
        scrollToBottom();
      });
    } catch (error) {
      if (!isMountedRef.current) return;
      console.error(error);
      notify.error({ message: 'Failed to send message. Please try again.' });
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id && m.id !== assistantMessageId));
    } finally {
      if (isMountedRef.current) {
        setIsStreaming(false);
      }
    }
  }, [input, isStreaming, agentId, messages, scrollToBottom]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.nativeEvent.isComposing) return;
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  if (loadingAuth || loadingAgent) return <LoadingScreen />;

  if (!agent) {
    return (
      <Stack gap='lg'>
        <Group gap='sm'>
          <ActionIcon component={Link} href='/agents' variant='subtle' size='lg'>
            <IconArrowLeft size={20} />
          </ActionIcon>
          <Title order={3}>Agent not found</Title>
        </Group>
        <Card shadow='sm' padding='xl' radius='md' withBorder>
          <Text ta='center' c='dimmed'>
            The agent you are looking for does not exist.
          </Text>
        </Card>
      </Stack>
    );
  }

  if (!agent.geminiFileSearchStoreId) {
    return (
      <Stack gap='md' className={styles.chatContainer}>
        <Group justify='space-between' align='center'>
          <Group gap='sm'>
            <ActionIcon component={Link} href='/agents' variant='subtle' size='lg'>
              <IconArrowLeft size={20} />
            </ActionIcon>
            <Box>
              <Title order={3}>{agent.name}</Title>
              {agent.description && (
                <Text size='sm' c='dimmed'>
                  {agent.description}
                </Text>
              )}
            </Box>
          </Group>
        </Group>
        <Card shadow='sm' padding='xl' radius='md' withBorder>
          <Text ta='center' c='dimmed'>
            This agent&apos;s knowledge base is not ready yet.
            <br />
            Please wait for the initial sync to complete.
          </Text>
        </Card>
      </Stack>
    );
  }

  return (
    <Stack gap='md' className={styles.chatContainer}>
      <Group justify='space-between' align='center'>
        <Group gap='sm'>
          <ActionIcon component={Link} href='/agents' variant='subtle' size='lg'>
            <IconArrowLeft size={20} />
          </ActionIcon>
          <Box>
            <Title order={3}>{agent.name}</Title>
            {agent.description && (
              <Text size='sm' c='dimmed'>
                {agent.description}
              </Text>
            )}
          </Box>
        </Group>
      </Group>

      <ScrollArea className={styles.scrollArea} viewportRef={viewportRef} type='auto'>
        <Stack gap='lg' p='md'>
          {messages.length === 0 ? (
            <Text ta='center' c='dimmed' py='xl'>
              Start a conversation by typing a message below.
            </Text>
          ) : (
            messages.map((message, index) => {
              const isUser = message.role === 'user';
              const showLoader = isStreaming && !isUser && index === messages.length - 1 && message.content === '';
              return (
                <Box
                  key={message.id}
                  p='md'
                  className={clsx(styles.messageBox, isUser ? styles.userMessageBox : styles.assistantMessageBox)}
                >
                  <Group align='flex-start' gap='sm' wrap='nowrap'>
                    <Box className={clsx(styles.avatar, isUser ? styles.userAvatar : styles.assistantAvatar)}>
                      {isUser ? <IconUser size={18} /> : <IconRobot size={18} />}
                    </Box>
                    <Box className={clsx(styles.messageContent, styles.markdownContent)}>
                      {showLoader ? (
                        <Group gap='xs'>
                          <Loader size='xs' />
                          <Text size='sm' c='dimmed'>
                            Generating response...
                          </Text>
                        </Group>
                      ) : (
                        <Markdown>{message.content}</Markdown>
                      )}
                    </Box>
                  </Group>
                </Box>
              );
            })
          )}
        </Stack>
      </ScrollArea>

      <Group gap='sm' align='flex-end'>
        <Textarea
          placeholder='Type your message...'
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          disabled={isStreaming}
          autosize
          minRows={1}
          maxRows={5}
          className={styles.textareaWrapper}
        />
        <ActionIcon
          variant='filled'
          color='brand'
          size='lg'
          onClick={handleSend}
          disabled={!input.trim() || isStreaming}
          loading={isStreaming}
        >
          <IconSend size={18} />
        </ActionIcon>
      </Group>
    </Stack>
  );
};
