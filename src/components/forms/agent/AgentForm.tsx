'use client';

import { Alert, Button, CopyButton, Group, Select, Stack, Text, Textarea, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useCallback, useState } from 'react';
import { z } from 'zod';
import {
  agentFieldLabels,
  defaultGeminiModel,
  defaultGoogleDriveType,
  driveSourceFieldLabels,
  geminiModels,
  geminiModelValues,
  googleDriveTypes,
} from '@local/shared';
import { LoadingOverlayButton } from '~/components/elements/buttons/LoadingOverlayButton';
import { agentRef, updateAgent } from '~/models/agent';
import { ApiError, createAgent } from '~/utils/api/fetch';
import { notify } from '~/utils/mantine/notifications';
import type { Agent, GeminiModel, GoogleDriveType } from '@local/shared';

const serviceAccountEmail = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL;

const ServiceAccountAlert = () => {
  if (!serviceAccountEmail) return null;

  return (
    <Alert variant='light' color='blue' title='Google Drive Integration'>
      <Text size='sm'>Please grant viewing permission to the following service account before creating an agent:</Text>
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
  name: string;
  slug: string;
  description: string;
  googleDriveType: GoogleDriveType;
  googleDriveId: string;
  googleDriveFolderId: string;
  geminiModel: GeminiModel;
};

const createSchema = (isEdit: boolean) =>
  z
    .object({
      name: z.string().min(1, 'Agent name is required'),
      slug: isEdit
        ? z.string()
        : z
            .string()
            .min(1, 'Slug is required')
            .max(64, 'Slug must be 64 characters or less')
            .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase alphanumeric characters and hyphens'),
      description: z.string(),
      googleDriveType: z.enum(['myDrive', 'sharedDrive']),
      googleDriveId: z.string(),
      googleDriveFolderId: z.string(),
      geminiModel: z.enum(geminiModelValues),
    })
    .superRefine((data, ctx) => {
      // Skip drive source validation in edit mode
      if (isEdit) return;
      if (data.googleDriveType === 'sharedDrive' && !data.googleDriveId) {
        ctx.addIssue({
          code: 'custom',
          message: 'Shared Drive ID is required',
          path: ['googleDriveId'],
        });
      }
      if (data.googleDriveType === 'myDrive' && !data.googleDriveFolderId) {
        ctx.addIssue({
          code: 'custom',
          message: 'Folder ID is required',
          path: ['googleDriveFolderId'],
        });
      }
    });

type Props = {
  agent?: Agent;
  onSubmit?: (result?: { token: string }) => void;
};

export const AgentForm = ({ agent, onSubmit }: Props) => {
  const isEdit = !!agent;
  const form = useForm<FormValues>({
    validate: zod4Resolver(createSchema(isEdit)),
    initialValues: {
      name: agent?.name ?? '',
      slug: agent?.id ?? '',
      description: agent?.description ?? '',
      googleDriveType: defaultGoogleDriveType,
      googleDriveId: '',
      googleDriveFolderId: '',
      geminiModel: agent?.geminiModel ?? defaultGeminiModel,
    },
  });
  const isSharedDrive = form.values.googleDriveType === 'sharedDrive';
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async ({
      name,
      slug,
      description,
      googleDriveType,
      googleDriveId,
      googleDriveFolderId,
      geminiModel,
    }: FormValues) => {
      try {
        setLoading(true);
        if (isEdit) {
          const ref = agentRef(agent.id);
          await updateAgent(ref, { name, description, geminiModel });
          notify.info({ message: 'Agent updated' });
          onSubmit?.();
        } else {
          const driveIdOrNull = googleDriveType === 'sharedDrive' ? googleDriveId || null : null;
          const folderId = googleDriveFolderId || (googleDriveType === 'myDrive' ? googleDriveId : '');
          const data = {
            slug,
            name,
            description,
            googleDriveType,
            googleDriveId: driveIdOrNull,
            googleDriveFolderId: folderId,
            geminiModel,
          };
          const { token } = await createAgent(data);
          notify.info({ message: 'Agent created' });
          onSubmit?.({ token });
        }
      } catch (error) {
        console.error(error);
        const isConflict = error instanceof ApiError && error.status === 409;
        const message = isConflict
          ? 'This slug is already in use'
          : isEdit
            ? 'Failed to update agent'
            : 'Failed to create agent';
        notify.error({ message });
      } finally {
        setLoading(false);
      }
    },
    [agent, isEdit, onSubmit],
  );

  return (
    <form onSubmit={form.onSubmit(handleSubmit)} aria-label={isEdit ? 'Edit Agent Form' : 'Create Agent Form'}>
      <Stack gap='md'>
        <TextInput
          label={agentFieldLabels['name']}
          aria-label={agentFieldLabels['name']}
          placeholder='My Agent'
          withAsterisk
          {...form.getInputProps('name')}
        />
        <TextInput
          label='Slug'
          aria-label='Slug'
          description={
            isEdit
              ? 'Slug cannot be changed after creation'
              : 'Used as skill name. Lowercase alphanumeric and hyphens only.'
          }
          placeholder='my-agent'
          withAsterisk={!isEdit}
          readOnly={isEdit}
          {...form.getInputProps('slug')}
        />
        <Textarea
          label={agentFieldLabels['description']}
          aria-label={agentFieldLabels['description']}
          description='Used for MCP server/Agent Skill description'
          placeholder='Description of this agent'
          rows={3}
          {...form.getInputProps('description')}
        />
        {!isEdit && (
          <>
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
              description={isSharedDrive ? 'If omitted, the entire drive will be synced' : undefined}
              placeholder='Target folder ID'
              withAsterisk={!isSharedDrive}
              {...form.getInputProps('googleDriveFolderId')}
            />
            <ServiceAccountAlert />
          </>
        )}
        <Select
          label={agentFieldLabels['geminiModel']}
          aria-label={agentFieldLabels['geminiModel']}
          data={geminiModels.map((m) => ({ value: m.value, label: m.label }))}
          withAsterisk
          {...form.getInputProps('geminiModel')}
        />
      </Stack>
      <Group justify='flex-end' mt='lg'>
        <LoadingOverlayButton
          type='submit'
          variant='outline'
          aria-label={isEdit ? 'Update' : 'Create'}
          loading={loading}
        >
          {isEdit ? 'Update' : 'Create'}
        </LoadingOverlayButton>
      </Group>
    </form>
  );
};
