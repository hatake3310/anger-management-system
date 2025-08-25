import { useQuery } from "@tanstack/react-query";
import AnalyticsCharts from "@/components/analytics-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, TrendingUp, Lightbulb } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Stats } from "@shared/types";
import { AngerRecord } from "@shared/schema";

export default function Analysis() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const { data: records, isLoading: recordsLoading } = useQuery<AngerRecord[]>({
    queryKey: ["/api/anger-records"],
  });

  const getDistortionLabel = (type: string): string => {
    const labels = {
      labeling: "ラベリング",
      mind_reading: "読心", 
      all_or_nothing: "白黒思考",
      personalization: "個人化",
      externalization: "外部化"
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getDistortionPercentage = (count: number, total: number): number => {
    return total > 0 ? Math.round((count / total) * 100) : 0;
  };

  if (isLoading || recordsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-200 h-96 rounded-xl"></div>
            <div className="bg-gray-200 h-96 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  const totalDistortions = stats?.commonDistortions?.reduce((sum: number, d: { type: string; count: number }) => sum + d.count, 0) || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">分析</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emotional Patterns Chart */}
        <Card>
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="flex items-center">
              <TrendingUp className="text-primary h-5 w-5 mr-2" />
              感情パターン分析
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <AnalyticsCharts records={records} />
            
            <div className="mt-4 grid grid-cols-2 gap-4 text-center">
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {records && records.length > 0
                    ? Math.round(records.reduce((sum, r) => sum + r.moodBefore, 0) / records.length)
                    : 0}%
                </div>
                <div className="text-sm text-red-800">平均記録前気分</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(stats?.avgMoodImprovement || 0)}%
                </div>
                <div className="text-sm text-green-800">平均改善度</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cognitive Distortions Analysis */}
        <Card>
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="flex items-center">
              <Brain className="text-accent h-5 w-5 mr-2" />
              認知の歪み分析
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {stats?.commonDistortions && stats.commonDistortions.length > 0 ? (
                stats.commonDistortions.map((distortion: { type: string; count: number }) => {
                  const percentage = getDistortionPercentage(distortion.count, totalDistortions);
                  return (
                    <div key={distortion.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-accent rounded-full mr-3"></div>
                        <span className="font-medium text-gray-900">
                          {getDistortionLabel(distortion.type)}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-32 mr-3">
                          <Progress value={percentage} className="h-2" />
                        </div>
                        <span className="text-sm text-gray-600 w-12">
                          {percentage}%
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">まだ十分なデータがありません</p>
                  <p className="text-sm text-gray-400">記録を続けて分析データを蓄積しましょう</p>
                </div>
              )}
            </div>
            
            {stats?.commonDistortions && stats.commonDistortions.length > 0 && (
              <div className="mt-6 p-4 bg-warm rounded-lg border border-orange-100">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Lightbulb className="text-accent h-4 w-4 mr-1" />
                  改善のヒント
                </h4>
                <p className="text-sm text-gray-700">
                  {stats.commonDistortions[0] && (
                    <>
                      「{getDistortionLabel(stats.commonDistortions[0].type)}」が最も多く検出されています。
                      {stats.commonDistortions[0].type === 'labeling' && 
                        "相手や自分に否定的なレッテルを貼る代わりに、具体的な行動や事実に焦点を当てるよう意識しましょう。"}
                      {stats.commonDistortions[0].type === 'mind_reading' && 
                        "相手の気持ちを推測する代わりに、直接確認したり事実に基づいて判断しましょう。"}
                      {stats.commonDistortions[0].type === 'all_or_nothing' && 
                        "極端な判断を避け、グレーゾーンや中間的な視点を探すことを心がけましょう。"}
                      {stats.commonDistortions[0].type === 'personalization' && 
                        "すべてを自分のせいにせず、他の要因や外部環境の影響も考慮してみましょう。"}
                      {stats.commonDistortions[0].type === 'externalization' && 
                        "外部要因のせいにするだけでなく、自分でコントロールできる部分も探してみましょう。"}
                    </>
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
