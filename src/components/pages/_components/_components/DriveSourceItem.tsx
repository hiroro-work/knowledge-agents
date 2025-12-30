'use client';

import { Anchor, Badge, Box, Button, Group, Stack, Text, TextInput } from '@mantine/core';
import { IconEdit, IconX } from '@tabler/icons-react';
import { useState } from 'react';
import { driveSourceFieldLabels, driveSourceSyncStatuses } from '@local/shared';
import { ConfirmButton } from '~/components/elements/buttons/ConfirmButton';
import { ModalButton } from '~/components/elements/buttons/ModalButton';
import { agentRef, updateAgent } from '~/models/agent';
import { notify } from '~/utils/mantine/notifications';
import type { Agent, DriveSourceSyncStatus } from '@local/shared';

export const getGoogleDriveFolderUrl = (googleDriveId: string) => {
  return `https://drive.google.com/drive/folders/${googleDriveId}`;
};

const syncStatusColorMap: Record<DriveSourceSyncStatus, string> = {
  pending: 'gray',
  syncing: 'blue',
  synced: 'green',
  error: 'red',
};

export const SyncStatusBadge = ({ status }: { status: DriveSourceSyncStatus }) => {
  const statusInfo = driveSourceSyncStatuses.find((s) => s.value === status);
  return (
    <Badge color={syncStatusColorMap[status]} className='tw:shrink-0'>
      {statusInfo?.label ?? status}
    </Badge>
  );
};

export type DriveSourceItemProps = {
  agentId: string;
  driveSourceId: string;
  driveSource: Agent['driveSources'][string];
  canEdit: boolean;
  canDelete: boolean;
  onDelete: (driveSourceId: string) => void;
  deleting: boolean;
};

export type EditDriveSourceFormProps = {
  agentId: string;
  driveSourceId: string;
  driveSource: Agent['driveSources'][string];
  onSubmit: () => void;
};

const EditDriveSourceForm = ({ agentId, driveSourceId, driveSource, onSubmit }: EditDriveSourceFormProps) => {
  const initialDisplayName = driveSource.displayName || driveSourceId;
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [saving, setSaving] = useState(false);
  const isChanged = displayName !== initialDisplayName;

  const handleSave = async () => {
    try {
      setSaving(true);
      const ref = agentRef(agentId);
      await updateAgent(ref, {
        [`driveSources.${driveSourceId}.displayName`]: displayName,
      });
      notify.info({ message: 'Display name updated' });
      onSubmit();
    } catch (error) {
      console.error(error);
      notify.error({ message: 'Failed to update display name' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap='md'>
      <TextInput
        label={driveSourceFieldLabels['displayName']}
        aria-label={driveSourceFieldLabels['displayName']}
        description='Folder ID will be shown if omitted'
        value={displayName}
        onChange={(e) => setDisplayName(e.currentTarget.value)}
      />
      {driveSource.googleDriveId && (
        <TextInput
          label={driveSourceFieldLabels['googleDriveId']}
          aria-label={driveSourceFieldLabels['googleDriveId']}
          value={driveSource.googleDriveId}
          readOnly
        />
      )}
      <TextInput
        label={driveSourceFieldLabels['googleDriveFolderId']}
        aria-label={driveSourceFieldLabels['googleDriveFolderId']}
        value={driveSource.googleDriveFolderId}
        readOnly
      />
      <Group justify='flex-end'>
        <Button onClick={handleSave} loading={saving} disabled={!isChanged}>
          Update
        </Button>
      </Group>
    </Stack>
  );
};

export const DriveSourceItem = ({
  agentId,
  driveSourceId,
  driveSource,
  canEdit,
  canDelete,
  onDelete,
  deleting,
}: DriveSourceItemProps) => (
  <Box
    p='xs'
    style={{
      backgroundColor: 'var(--mantine-color-dark-7)',
      borderRadius: 'var(--mantine-radius-sm)',
    }}
  >
    <Stack gap={2}>
      <Group gap='xs' wrap='nowrap' justify='space-between'>
        <Text size='xs' fw={500} truncate style={{ minWidth: 0 }}>
          {driveSource.displayName || driveSourceId}
        </Text>
        <Group gap='xs' wrap='nowrap'>
          {canEdit && (
            <ModalButton
              variant='subtle'
              color='gray'
              size='compact-xs'
              px={4}
              modalProps={{ title: 'Edit Drive Source' }}
              modalContent={({ close }) => (
                <EditDriveSourceForm
                  agentId={agentId}
                  driveSourceId={driveSourceId}
                  driveSource={driveSource}
                  onSubmit={close}
                />
              )}
            >
              <IconEdit size={12} />
            </ModalButton>
          )}
          {canDelete && driveSource.syncStatus !== 'syncing' && (
            <ConfirmButton
              variant='subtle'
              color='red'
              size='compact-xs'
              px={4}
              message={`Delete drive source "${driveSource.displayName || driveSourceId}"?\nRelated files will also be deleted.`}
              onConfirm={() => onDelete(driveSourceId)}
              loading={deleting}
            >
              <IconX size={14} />
            </ConfirmButton>
          )}
          <SyncStatusBadge status={driveSource.syncStatus} />
        </Group>
      </Group>
      <Anchor
        href={getGoogleDriveFolderUrl(driveSource.googleDriveFolderId)}
        target='_blank'
        rel='noopener noreferrer'
        size='xs'
        style={{ wordBreak: 'break-all' }}
      >
        {driveSource.googleDriveFolderId}
      </Anchor>
      {driveSource.lastSyncedAt && (
        <Text size='xs' c='dimmed'>
          {driveSourceFieldLabels['lastSyncedAt']}: {driveSource.lastSyncedAt.toDate().toLocaleString()}
        </Text>
      )}
      {driveSource.syncErrorMessage && (
        <Text size='xs' c='red'>
          Error: {driveSource.syncErrorMessage}
        </Text>
      )}
    </Stack>
  </Box>
);
