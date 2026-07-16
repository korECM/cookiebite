"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export const description = "다중 막대 차트 — 라이브 shadcn 레지스트리 원본"

// 레지스트리 원본 데이터를 가상 한글 라벨로 손질 — month는 english accessorKey, 값은 한글
const chartData = [
  { month: "1월", desktop: 4200, mobile: 5100 },
  { month: "2월", desktop: 3800, mobile: 5400 },
  { month: "3월", desktop: 5100, mobile: 6200 },
  { month: "4월", desktop: 4700, mobile: 6800 },
  { month: "5월", desktop: 5600, mobile: 7300 },
  { month: "6월", desktop: 6100, mobile: 8100 },
]

// 색은 이미 var(--chart-N) 토큰이라 lint 통과, label만 한글로 손질
const chartConfig = {
  desktop: {
    label: "웹",
    color: "var(--chart-1)",
  },
  mobile: {
    label: "앱",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function ChartBarMultiple() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>플랫폼별 접속 추이</CardTitle>
        <CardDescription>1월 - 6월 (가상 데이터)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
            <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          이번 달 5.2% 상승 <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          최근 6개월 총 접속 수
        </div>
      </CardFooter>
    </Card>
  )
}
