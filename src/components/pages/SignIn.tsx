'use client';

import { Box, Center, Paper, Stack, Text, Title } from '@mantine/core';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { SignInWithEmailAndPasswordForm } from '~/components/forms/auth/SignInWithEmailAndPasswordForm';
import { SignInWithGoogleForm } from '~/components/forms/auth/SignInWithGoogleForm';
import { isDevelopment, isTest } from '~/utils/utils';

export const SignIn = () => {
  const searchParams = useSearchParams();
  const authParam = searchParams.get('auth');
  const showEmailPasswordForm = (isDevelopment() || isTest()) && authParam !== 'google';

  return (
    <Center mih='calc(100dvh - 120px)'>
      <Paper radius='lg' p='xl' w={400} maw='90vw'>
        <Stack align='center' gap='lg'>
          <Image src='/android-chrome-192x192.png' alt='Knowledge Agents' width={64} height={64} />
          <Stack align='center' gap='xs'>
            <Title order={2} ta='center'>
              Welcome
            </Title>
            <Text c='dimmed' size='sm' ta='center'>
              Sign in to access your AI knowledge agents
            </Text>
          </Stack>
          <Box w='100%'>{showEmailPasswordForm ? <SignInWithEmailAndPasswordForm /> : <SignInWithGoogleForm />}</Box>
        </Stack>
      </Paper>
    </Center>
  );
};
