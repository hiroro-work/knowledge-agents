'use client';

import { Alert, Button, CopyButton, Group, Select, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useCallback, useState } from 'react';
import { z } from 'zod';
import { defaultGoogleDriveType, driveSourceFieldLabels, googleDriveTypes } from '@local/shared';
import { LoadingOverlayButton } from '~/components/elements/buttons/LoadingOverlayButton';
import { addDriveSource } from '~/utils/api/fetch';
import { notify } from '~/utils/mantine/notifications';
import type { GoogleDriveType } from '@local/shared';

const serviceAccountEmail = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL;

const ServiceAccountAlert = () => {
  if (!serviceAccountEmail) return null;

  return (
    <Alert variant='light' color='blue' title='Google Drive Integration'>
      <Text size='sm'>Please grant view permission to the following service account before adding a drive source:</Text>
      <Group gap='xs' mt='xs'>
        <Text size='sm' fw={500} style={{ fontFamily: 'monospace' }}>
          {serviceAccountEmail}
        </Text>
        <CopyButton value={serviceAccountEmail}>
          {({ copied, copy }) => (
            <Button variant='light' size='xs' onClick={copy}>
              {copied ? 'Copied' : 'Copy'}
            </Button>
          )}
        </CopyButton>
      </Group>
    </Alert>
  );
};

type FormValues = {
  googleDriveType: GoogleDriveType;
  googleDriveId: string;
  googleDriveFolderId: string;
  displayName: string;
};

const schema = z
  .object({
    googleDriveType: z.enum(['myDrive', 'sharedDrive']),
    googleDriveId: z.string(),
    googleDriveFolderId: z.string(),
    displayName: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.googleDriveType === 'sharedDrive' && !data.googleDriveId) {
      ctx.addIssue({
        code: 'custom',
        message: 'Please enter the shared drive ID',
        path: ['googleDriveId'],
      });
    }
    if (data.googleDriveType === 'myDrive' && !data.googleDriveFolderId) {
      ctx.addIssue({
        code: 'custom',
        message: 'Please enter the folder ID',
        path: ['googleDriveFolderId'],
      });
    }
  });

type Props = {
  agentId: string;
  onSubmit?: () => void;
};

export const AddDriveSourceForm = ({ agentId, onSubmit }: Props) => {
  const form = useForm<FormValues>({
    validate: zod4Resolver(schema),
    initialValues: {
      googleDriveType: defaultGoogleDriveType,
      googleDriveId: '',
      googleDriveFolderId: '',
      displayName: '',
    },
  });
  const isSharedDrive = form.values.googleDriveType === 'sharedDrive';
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async ({ googleDriveType, googleDriveId, googleDriveFolderId, displayName }: FormValues) => {
      try {
        setLoading(true);
        const driveIdOrNull = googleDriveType === 'sharedDrive' ? googleDriveId || null : null;
        const folderId = googleDriveFolderId || (googleDriveType === 'myDrive' ? googleDriveId : '');
        await addDriveSource({
          agentId,
          googleDriveType,
          googleDriveId: driveIdOrNull,
          googleDriveFolderId: folderId,
          displayName: displayName || undefined,
        });
        notify.info({ message: 'Drive source added successfully' });
        onSubmit?.();
      } catch (error) {
        console.error(error);
        notify.error({ message: 'Failed to add drive source' });
      } finally {
        setLoading(false);
      }
    },
    [agentId, onSubmit],
  );

  return (
    <form onSubmit={form.onSubmit(handleSubmit)} aria-label='Add Drive Source Form'>
      <Stack gap='md'>
        <TextInput
          label='Display Name'
          aria-label='Display Name'
          description='Folder ID will be used if omitted'
          placeholder='Knowledge Folder 1'
          {...form.getInputProps('displayName')}
        />
        <Select
          label={driveSourceFieldLabels['googleDriveType']}
          aria-label={driveSourceFieldLabels['googleDriveType']}
          data={googleDriveTypes.map((type) => ({ value: type.value, label: type.label }))}
          withAsterisk
          {...form.getInputProps('googleDriveType')}
        />
        {isSharedDrive && (
          <TextInput
            label={driveSourceFieldLabels['googleDriveId']}
            aria-label={driveSourceFieldLabels['googleDriveId']}
            placeholder='Shared Drive ID'
            withAsterisk
            {...form.getInputProps('googleDriveId')}
          />
        )}
        <TextInput
          label={driveSourceFieldLabels['googleDriveFolderId']}
          aria-label={driveSourceFieldLabels['googleDriveFolderId']}
          description={isSharedDrive ? 'Syncs entire drive if not specified' : undefined}
          placeholder='Folder ID to sync'
          withAsterisk={!isSharedDrive}
          {...form.getInputProps('googleDriveFolderId')}
        />
        <ServiceAccountAlert />
      </Stack>
      <Group justify='flex-end' mt='lg'>
        <LoadingOverlayButton type='submit' variant='outline' aria-label='Add' loading={loading}>
          Add
        </LoadingOverlayButton>
      </Group>
    </form>
  );
};
