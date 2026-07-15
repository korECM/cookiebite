import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function App() {
  return (
    <Tabs defaultValue="one">
      <TabsList>
        <TabsTrigger value="one">tab-one-label</TabsTrigger>
        <TabsTrigger value="two">tab-two-label</TabsTrigger>
      </TabsList>
      <TabsContent value="one">tab-one-content</TabsContent>
      <TabsContent value="two">tab-two-content</TabsContent>
    </Tabs>
  );
}
