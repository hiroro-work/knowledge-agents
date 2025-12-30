import { ActionIcon, Group, Stack, Text, TextInput, Tooltip } from '@mantine/core';
import { modals } from '@mantine/modals';
import { IconCheck, IconCopy, IconEye, IconEyeOff, IconKey } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { ConfirmButton } from '~/components/elements/buttons/ConfirmButton';
import { getMcpToken, regenerateMcpToken } from '~/utils/api/fetch';
import { notify } from '~/utils/mantine/notifications';
import { TokenDisplay } from './TokenDisplay';

export type TokenViewerProps = {
  agentId: string;
  hasEncryptedToken: boolean;
  canManage: boolean;
};

export const TokenViewer = ({ agentId, hasEncryptedToken, canManage }: TokenViewerProps) => {
  const [visible, setVisible] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const copiedTimeoutRef = useRef<number | undefined>(undefined);
  const maskedToken = '********************************';

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, []);

  const fetchToken = async (): Promise<string | null> => {
    if (token) return token;
    if (!hasEncryptedToken) return null;
    try {
      const result = await getMcpToken({ agentId });
      setToken(result.token);
      return result.token;
    } catch {
      notify.error({ message: 'Failed to get token' });
      return null;
    }
  };

  const handleToggleVisibility = async () => {
    if (!visible && !token && hasEncryptedToken) {
      setLoading(true);
      try {
        await fetchToken();
      } finally {
        setLoading(false);
      }
    }
    setVisible(!visible);
  };

  const handleCopy = async () => {
    setCopying(true);
    try {
      const tokenToCopy = await fetchToken();
      if (tokenToCopy) {
        await navigator.clipboard.writeText(tokenToCopy);
        setCopied(true);
        if (copiedTimeoutRef.current) {
          clearTimeout(copiedTimeoutRef.current);
        }
        copiedTimeoutRef.current = window.setTimeout(() => {
          setCopied(false);
          copiedTimeoutRef.current = undefined;
        }, 2000);
      }
    } catch (error) {
      if (error instanceof DOMException) {
        notify.error({ message: 'Failed to copy to clipboard' });
      }
    } finally {
      setCopying(false);
    }
  };

  const handleRegenerateToken = async () => {
    try {
      setRegenerating(true);
      const { token: newToken } = await regenerateMcpToken({ agentId });
      setToken(newToken);
      setVisible(true);
      modals.open({
        title: 'MCP Token',
        children: <TokenDisplay token={newToken} />,
      });
    } catch {
      notify.error({ message: 'Failed to regenerate token' });
    } finally {
      setRegenerating(false);
    }
  };

  if (!canManage) {
    return null;
  }

  const displayValue = visible && token ? token : maskedToken;

  const renderButtons = () => (
    <Group gap='xs' wrap='nowrap'>
      {hasEncryptedToken && (
        <>
          <Tooltip label={visible ? 'Hide token' : 'Show token'} withArrow>
            <ActionIcon variant='subtle' color='gray' onClick={handleToggleVisibility} loading={loading} size='sm'>
              {visible ? <IconEyeOff size={14} /> : <IconEye size={14} />}
            </ActionIcon>
          </Tooltip>
          <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow>
            <ActionIcon
              color={copied ? 'teal' : 'gray'}
              variant='subtle'
              onClick={handleCopy}
              loading={copying}
              size='sm'
            >
              {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
            </ActionIcon>
          </Tooltip>
        </>
      )}
      <Tooltip label='Regenerate token' withArrow>
        <ConfirmButton
          variant='subtle'
          color='gray'
          size='compact-xs'
          px={4}
          message='Regenerate MCP token? The existing token will be invalidated.'
          onConfirm={handleRegenerateToken}
          loading={regenerating}
        >
          <IconKey size={14} />
        </ConfirmButton>
      </Tooltip>
    </Group>
  );

  return (
    <Stack gap={4}>
      <Group gap='xs' justify='space-between'>
        <Text size='xs' c='dimmed' fw={500}>
          Token
        </Text>
        {renderButtons()}
      </Group>
      {hasEncryptedToken ? (
        <TextInput value={displayValue} readOnly size='xs' styles={{ input: { fontFamily: 'monospace' } }} />
      ) : (
        <Text size='xs' c='dimmed'>
          Token needs to be regenerated to display
        </Text>
      )}
    </Stack>
  );
};
