import { Callout } from '@/components/blocks/callout';
import { label } from '@/data/helpers';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function App() {
  return (
    <Callout>
      <Card className={cn('p-2')}>{label()}</Card>
    </Callout>
  );
}
