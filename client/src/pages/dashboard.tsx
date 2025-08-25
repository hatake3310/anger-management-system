import { useQuery } from "@tanstack/react-query";
import StatsCard from "@/components/stats-card";
import { Calendar, Smile, Lightbulb, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Stats } from "@shared/types";
import { AngerRecord } from "@shared/schema";

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const { data: recentRecords, isLoading: recordsLoading } = useQuery<AngerRecord[]>({
    queryKey: ["/api/anger-records"],
  });

  if (isLoading || recordsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-200 h-32 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">ダッシュボード</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="今週の記録"
            value={stats?.weeklyRecords || 0}
            icon={Calendar}
            trend={{
              value: "前週比 +15%",
              positive: true
            }}
          />
          
          <StatsCard
            title="平均気分改善"
            value={`${Math.round(stats?.avgMoodImprovement || 0)}%`}
            subtitle="今週の平均"
            icon={Smile}
            bgColor="bg-green-50"
          />
          
          <StatsCard
            title="認知の歪み検出"
            value={stats?.commonDistortions?.reduce((sum: number, d: { type: string; count: number }) => sum + d.count, 0) || 0}
            subtitle="今月の合計"
            icon={Lightbulb}
            bgColor="bg-warm"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                クイックアクション
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/record">
                <Button className="w-full justify-start">
                  新しい記録を追加
                </Button>
              </Link>
              <Link href="/history">
                <Button variant="outline" className="w-full justify-start">
                  過去の記録を確認
                </Button>
              </Link>
              <Link href="/analysis">
                <Button variant="outline" className="w-full justify-start">
                  パターン分析を見る
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>最近の傾向</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.commonDistortions && stats.commonDistortions.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-3">
                    よく検出される認知の歪み:
                  </p>
                  {stats.commonDistortions.slice(0, 3).map((distortion: { type: string; count: number }) => (
                    <div key={distortion.type} className="flex justify-between items-center">
                      <span className="text-sm">{getDistortionLabel(distortion.type)}</span>
                      <span className="text-sm font-medium text-accent">{distortion.count}回</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  まだ十分なデータがありません。記録を続けて傾向を把握しましょう。
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function getDistortionLabel(type: string): string {
  const labels = {
    labeling: "ラベリング",
    mind_reading: "読心",
    all_or_nothing: "白黒思考",
    personalization: "個人化",
    externalization: "外部化"
  };
  return labels[type as keyof typeof labels] || type;
}
