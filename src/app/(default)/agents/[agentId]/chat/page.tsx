import { Chat } from '~/components/pages/Chat';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chat',
};

type PageProps = {
  params: Promise<{ agentId: string }>;
};

export default async function Page({ params }: PageProps) {
  const { agentId } = await params;
  return <Chat agentId={agentId} />;
}
