'use client';

import {
  ActionIcon,
  Box,
  Card,
  Collapse,
  CopyButton,
  Group,
  Stack,
  Text,
  Title,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconCheck,
  IconChevronDown,
  IconCopy,
  IconDownload,
  IconEdit,
  IconFolderPlus,
  IconMessageCircle,
  IconRefresh,
  IconTerminal2,
  IconTrash,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ConfirmButton } from '~/components/elements/buttons/ConfirmButton';
import { ModalButton } from '~/components/elements/buttons/ModalButton';
import { AddDriveSourceForm } from '~/components/forms/agent/AddDriveSourceForm';
import { AgentForm } from '~/components/forms/agent/AgentForm';
import { downloadBlob, generateSkillZip } from '~/utils/agentSkill/generateSkillZip';
import { deleteAgentApi, deleteDriveSource, getMcpToken, syncAgent } from '~/utils/api/fetch';
import { notify } from '~/utils/mantine/notifications';
import { DriveSourceItem, SyncStatusBadge } from './_components/DriveSourceItem';
import { TokenViewer } from './_components/TokenViewer';
import type { Agent, DriveSourceSyncStatus } from '@local/shared';

export const getMcpServerEndpoint = (agentId: string) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/api/agents/${agentId}/mcp`;
};

export const getQueryEndpoint = () => {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/api/agents/query`;
};

const getClaudeCodeCommand = (agentId: string, endpoint: string, token: string) => {
  return `claude mcp add "${agentId}" "${endpoint}" --transport http --header "Authorization: Bearer ${token}"`;
};

/**
 * Get aggregate sync status from all drive sources
 */
export const getAggregateSyncStatus = (agent: Agent): DriveSourceSyncStatus => {
  if (Object.keys(agent.driveSources).length === 0) {
    return 'pending';
  }
  const statuses = Object.values(agent.driveSources).map((ds) => ds.syncStatus);
  if (statuses.some((s) => s === 'error')) return 'error';
  if (statuses.some((s) => s === 'syncing')) return 'syncing';
  if (statuses.every((s) => s === 'synced')) return 'synced';
  return 'pending';
};

export type AgentCardProps = {
  agent: Agent;
  currentUserId?: string;
  isAdmin?: boolean;
};

export const AgentCard = ({ agent, currentUserId, isAdmin }: AgentCardProps) => {
  const chatHref = `/agents/${agent.id}/chat`;
  const [syncing, setSyncing] = useState(false);
  const [deletingDriveSourceId, setDeletingDriveSourceId] = useState<string | null>(null);
  const [driveSourcesOpened, { toggle: toggleDriveSources }] = useDisclosure(false);
  const [aiIntegrationOpened, { toggle: toggleAiIntegration }] = useDisclosure(false);
  const [copyingCommand, setCopyingCommand] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState(false);
  const copiedCommandTimeoutRef = useRef<number | undefined>(undefined);
  const [downloading, setDownloading] = useState(false);
  const isCreator = currentUserId === agent.createdBy;
  const canRegenerateToken = isCreator || isAdmin;
  const canDelete = isCreator || isAdmin;
  const canManageDriveSources = true; // All authenticated users can manage drive sources
  const canCopyCommand = true; // All authenticated users can copy command
  const isSyncing = Object.values(agent.driveSources).some((ds) => ds.syncStatus === 'syncing');
  const canSync =
    !!agent.geminiFileSearchStoreId &&
    !isSyncing &&
    Object.values(agent.driveSources).some((ds) => ds.googleDriveSyncPageToken || ds.syncStatus === 'error');
  const canEdit = true; // All authenticated users can edit
  const driveSourceEntries = Object.entries(agent.driveSources).sort(
    ([, a], [, b]) => (a.createdAt?.toMillis() ?? 0) - (b.createdAt?.toMillis() ?? 0),
  );
  const driveSourceCount = driveSourceEntries.length;
  const [firstDriveSource, ...restDriveSources] = driveSourceEntries;
  const hasMoreDriveSources = restDriveSources.length > 0;

  const handleDelete = async () => {
    try {
      await deleteAgentApi({ agentId: agent.id });
      notify.info({ message: 'Agent deleted successfully' });
    } catch (error) {
      console.error(error);
      notify.error({ message: 'Failed to delete agent' });
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      await syncAgent({ agentId: agent.id });
      notify.info({ message: 'Sync started' });
    } catch (error) {
      console.error(error);
      notify.error({ message: 'Failed to start sync' });
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteDriveSource = async (driveSourceId: string) => {
    try {
      setDeletingDriveSourceId(driveSourceId);
      await deleteDriveSource({ agentId: agent.id, driveSourceId });
      notify.info({ message: 'Drive source deleted successfully' });
    } catch (error) {
      console.error(error);
      notify.error({ message: 'Failed to delete drive source' });
    } finally {
      setDeletingDriveSourceId(null);
    }
  };

  const handleCopyCommand = async () => {
    if (!agent.authTokenEncrypted) return;
    setCopyingCommand(true);
    try {
      const { token } = await getMcpToken({ agentId: agent.id });
      if (!token) {
        notify.error({ message: 'Failed to get token' });
        return;
      }
      const endpoint = getMcpServerEndpoint(agent.id);
      const command = getClaudeCodeCommand(agent.id, endpoint, token);
      await navigator.clipboard.writeText(command);
      setCopiedCommand(true);
      if (copiedCommandTimeoutRef.current) {
        clearTimeout(copiedCommandTimeoutRef.current);
      }
      copiedCommandTimeoutRef.current = window.setTimeout(() => {
        setCopiedCommand(false);
        copiedCommandTimeoutRef.current = undefined;
      }, 2000);
    } catch (error) {
      if (error instanceof DOMException) {
        notify.error({ message: 'Failed to copy to clipboard' });
      } else {
        notify.error({ message: 'Failed to get token' });
      }
    } finally {
      setCopyingCommand(false);
    }
  };

  const handleDownloadSkill = async () => {
    if (!agent.authTokenEncrypted) return;
    setDownloading(true);
    try {
      const { token } = await getMcpToken({ agentId: agent.id });
      if (!token) {
        notify.error({ message: 'Failed to get token' });
        return;
      }
      const queryEndpoint = getQueryEndpoint();
      const blob = await generateSkillZip({
        agentId: agent.id,
        agentName: agent.name,
        slug: agent.id,
        description: agent.description,
        queryEndpoint,
        token,
      });
      downloadBlob(blob, `${agent.id}-skill.zip`);
      notify.info({ message: 'Agent Skill downloaded successfully' });
    } catch (error) {
      console.error(error);
      notify.error({ message: 'Failed to download' });
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (copiedCommandTimeoutRef.current) {
        clearTimeout(copiedCommandTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Card padding='lg' withBorder h='100%'>
      <Stack gap='md' h='100%' justify='space-between'>
        <Stack gap='sm'>
          <Group justify='space-between' align='flex-start' wrap='nowrap' className='tw:overflow-hidden'>
            <Box className='tw:flex-1'>
              <Title order={4}>{agent.name}</Title>
              <Text size='xs' c='dimmed' mt={2}>
                {agent.id}
              </Text>
            </Box>
            <Group gap='xs' wrap='nowrap' className='tw:shrink-0'>
              <SyncStatusBadge status={getAggregateSyncStatus(agent)} />
            </Group>
          </Group>
          {agent.description && (
            <Text size='sm' c='dimmed' lineClamp={2}>
              {agent.description}
            </Text>
          )}
        </Stack>

        <Stack gap='sm'>
          <Stack gap='xs'>
            <Group gap='xs' justify='space-between'>
              <Text size='xs' c='dimmed' fw={500}>
                Drive Sources ({driveSourceCount})
              </Text>
              {canManageDriveSources && (
                <ModalButton
                  variant='subtle'
                  color='gray'
                  size='compact-xs'
                  px={4}
                  modalProps={{ title: 'Add Drive Source' }}
                  modalContent={({ close }) => <AddDriveSourceForm agentId={agent.id} onSubmit={close} />}
                >
                  <IconFolderPlus size={14} />
                </ModalButton>
              )}
            </Group>
            {firstDriveSource ? (
              <>
                <DriveSourceItem
                  agentId={agent.id}
                  driveSourceId={firstDriveSource[0]}
                  driveSource={firstDriveSource[1]}
                  canEdit={!!canManageDriveSources}
                  canDelete={!!canManageDriveSources && driveSourceCount > 1}
                  onDelete={handleDeleteDriveSource}
                  deleting={deletingDriveSourceId === firstDriveSource[0]}
                />
                {hasMoreDriveSources && (
                  <>
                    <Collapse in={driveSourcesOpened}>
                      <Stack gap='xs'>
                        {restDriveSources.map(([driveSourceId, driveSource]) => (
                          <DriveSourceItem
                            key={driveSourceId}
                            agentId={agent.id}
                            driveSourceId={driveSourceId}
                            driveSource={driveSource}
                            canEdit={!!canManageDriveSources}
                            canDelete={!!canManageDriveSources}
                            onDelete={handleDeleteDriveSource}
                            deleting={deletingDriveSourceId === driveSourceId}
                          />
                        ))}
                      </Stack>
                    </Collapse>
                    <UnstyledButton onClick={toggleDriveSources} className='tw:w-full'>
                      <Group gap={4} justify='center'>
                        <Text size='xs' c='dimmed'>
                          {driveSourcesOpened ? 'Show less' : `Show ${restDriveSources.length} more`}
                        </Text>
                        <IconChevronDown
                          size={14}
                          style={{
                            transform: driveSourcesOpened ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 200ms ease',
                          }}
                          color='var(--mantine-color-dimmed)'
                        />
                      </Group>
                    </UnstyledButton>
                  </>
                )}
              </>
            ) : (
              <Text size='xs' c='dimmed'>
                No drive sources configured
              </Text>
            )}
          </Stack>
          <Stack gap='xs'>
            <UnstyledButton onClick={toggleAiIntegration} className='tw:w-full'>
              <Group gap='xs' justify='space-between'>
                <Text size='xs' c='dimmed' fw={500}>
                  AI Agent Integration
                </Text>
                <IconChevronDown
                  size={14}
                  style={{
                    transform: aiIntegrationOpened ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 200ms ease',
                  }}
                  color='var(--mantine-color-dimmed)'
                />
              </Group>
            </UnstyledButton>
            <Collapse in={aiIntegrationOpened}>
              <Stack gap='xs'>
                <Box>
                  <Group gap='xs' justify='space-between' mb={4}>
                    <Text size='xs' c='dimmed'>
                      MCP Endpoint
                    </Text>
                    <Group gap='xs' wrap='nowrap'>
                      <CopyButton value={getMcpServerEndpoint(agent.id)}>
                        {({ copied, copy }) => (
                          <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow>
                            <ActionIcon color={copied ? 'teal' : 'gray'} variant='subtle' onClick={copy} size='sm'>
                              {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                            </ActionIcon>
                          </Tooltip>
                        )}
                      </CopyButton>
                      {canCopyCommand && agent.authTokenEncrypted && (
                        <Tooltip label={copiedCommand ? 'Copied' : 'Copy Claude Code integration command'} withArrow>
                          <ActionIcon
                            color={copiedCommand ? 'teal' : 'gray'}
                            variant='subtle'
                            onClick={handleCopyCommand}
                            loading={copyingCommand}
                            size='sm'
                          >
                            {copiedCommand ? <IconCheck size={14} /> : <IconTerminal2 size={14} />}
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </Group>
                  </Group>
                  <Text size='xs' style={{ wordBreak: 'break-all' }}>
                    {getMcpServerEndpoint(agent.id)}
                  </Text>
                  <Box mt='xs'>
                    <TokenViewer
                      agentId={agent.id}
                      hasEncryptedToken={!!agent.authTokenEncrypted}
                      canManage={!!canRegenerateToken}
                    />
                  </Box>
                </Box>
                {canCopyCommand && agent.authTokenEncrypted && (
                  <Group gap='xs' justify='space-between'>
                    <Text size='xs' c='dimmed'>
                      Agent Skill
                    </Text>
                    <ConfirmButton
                      variant='subtle'
                      color='gray'
                      size='compact-xs'
                      px={4}
                      message='The download file contains an API token. Please handle the file with care. Do you want to download?'
                      onConfirm={handleDownloadSkill}
                      loading={downloading}
                      aria-label='Download Agent Skill'
                    >
                      <IconDownload size={14} />
                    </ConfirmButton>
                  </Group>
                )}
              </Stack>
            </Collapse>
          </Stack>
        </Stack>

        <Group justify='flex-end' gap='xs'>
          <Tooltip label='Chat' withArrow>
            <ActionIcon
              component={Link}
              href={chatHref}
              variant='light'
              color='brand'
              size='lg'
              disabled={!agent.geminiFileSearchStoreId}
            >
              <IconMessageCircle size={18} />
            </ActionIcon>
          </Tooltip>
          {canSync && (
            <Tooltip label='Sync' withArrow>
              <ConfirmButton
                variant='light'
                size='compact-lg'
                px={10}
                message='Do you want to sync the knowledge?'
                onConfirm={handleSync}
                loading={syncing || isSyncing}
                disabled={syncing || isSyncing}
              >
                <IconRefresh size={18} />
              </ConfirmButton>
            </Tooltip>
          )}
          {canEdit && (
            <Tooltip label='Edit' withArrow>
              <ModalButton
                variant='light'
                size='compact-lg'
                px={10}
                modalProps={{ title: 'Edit Agent' }}
                modalContent={({ close }) => <AgentForm agent={agent} onSubmit={close} />}
                aria-label='Edit Agent'
              >
                <IconEdit size={18} />
              </ModalButton>
            </Tooltip>
          )}
          {canDelete && (
            <Tooltip label='Delete' withArrow>
              <ConfirmButton
                variant='light'
                color='red'
                size='compact-lg'
                px={10}
                message={`Delete agent "${agent.name}"?\nThis action cannot be undone.`}
                onConfirm={handleDelete}
              >
                <IconTrash size={18} />
              </ConfirmButton>
            </Tooltip>
          )}
        </Group>
      </Stack>
    </Card>
  );
};
