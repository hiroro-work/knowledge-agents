import { Agents } from '~/components/pages/Agents';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Agents',
};

export default function Page() {
  return <Agents />;
}
