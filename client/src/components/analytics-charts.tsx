import { AngerRecord, Emotion } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { useMemo } from "react";

interface AnalyticsChartsProps {
  records?: AngerRecord[];
}

export default function AnalyticsCharts({ records }: AnalyticsChartsProps) {
  const chartData = useMemo(() => {
    if (!records || records.length === 0) return [];

    // Group records by date and calculate average mood
    const dateGroups = records.reduce((acc, record) => {
      const date = record.date;
      if (!acc[date]) {
        acc[date] = { moodBefore: [], moodAfter: [], improvement: [] };
      }
      acc[date].moodBefore.push(record.moodBefore);
      acc[date].moodAfter.push(record.moodAfter);
      acc[date].improvement.push(
        Math.round(((record.moodBefore - record.moodAfter) / record.moodBefore) * 100)
      );
      return acc;
    }, {} as Record<string, { moodBefore: number[]; moodAfter: number[]; improvement: number[] }>);

    return Object.entries(dateGroups)
      .map(([date, data]) => ({
        date,
        avgMoodBefore: Math.round(data.moodBefore.reduce((sum, val) => sum + val, 0) / data.moodBefore.length),
        avgMoodAfter: Math.round(data.moodAfter.reduce((sum, val) => sum + val, 0) / data.moodAfter.length),
        avgImprovement: Math.round(data.improvement.reduce((sum, val) => sum + val, 0) / data.improvement.length)
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7); // Last 7 data points
  }, [records]);

  const emotionData = useMemo(() => {
    if (!records || records.length === 0) return [];

    const emotionCounts: Record<string, number> = {};
    const emotionIntensities: Record<string, number[]> = {};

    records.forEach(record => {
      try {
        const emotions = JSON.parse(record.emotions) as Emotion[];
        emotions.forEach(emotion => {
          emotionCounts[emotion.type] = (emotionCounts[emotion.type] || 0) + 1;
          if (!emotionIntensities[emotion.type]) {
            emotionIntensities[emotion.type] = [];
          }
          emotionIntensities[emotion.type].push(emotion.intensity);
        });
      } catch {
        // Skip invalid emotion data
      }
    });

    return Object.entries(emotionCounts)
      .map(([type, count]) => ({
        type,
        count,
        avgIntensity: Math.round(
          emotionIntensities[type].reduce((sum, val) => sum + val, 0) / emotionIntensities[type].length
        )
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [records]);

  if (!records || records.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg h-64 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">📊</div>
          <p>記録データが不足しています</p>
          <p className="text-sm">記録を追加すると分析チャートが表示されます</p>
        </div>
      </div>
    );
  }

  const maxMood = Math.max(
    ...chartData.flatMap(d => [d.avgMoodBefore, d.avgMoodAfter])
  );

  return (
    <div className="space-y-6">
      {/* Mood Trend Chart */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-4">気分の変化トレンド</h4>
        <div className="relative h-32">
          <svg className="w-full h-full" viewBox="0 0 400 120">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map(y => (
              <line
                key={y}
                x1="0"
                y1={120 - (y * 1.2)}
                x2="400"
                y2={120 - (y * 1.2)}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            ))}
            
            {chartData.length > 1 && (
              <>
                {/* Before mood line */}
                <polyline
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  points={chartData
                    .map((d, i) => `${(i * 400) / (chartData.length - 1)},${120 - (d.avgMoodBefore * 1.2)}`)
                    .join(' ')}
                />
                
                {/* After mood line */}
                <polyline
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2"
                  points={chartData
                    .map((d, i) => `${(i * 400) / (chartData.length - 1)},${120 - (d.avgMoodAfter * 1.2)}`)
                    .join(' ')}
                />
                
                {/* Data points */}
                {chartData.map((d, i) => (
                  <g key={i}>
                    <circle
                      cx={(i * 400) / (chartData.length - 1)}
                      cy={120 - (d.avgMoodBefore * 1.2)}
                      r="3"
                      fill="#ef4444"
                    />
                    <circle
                      cx={(i * 400) / (chartData.length - 1)}
                      cy={120 - (d.avgMoodAfter * 1.2)}
                      r="3"
                      fill="#22c55e"
                    />
                  </g>
                ))}
              </>
            )}
          </svg>
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-2">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span>記録前</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span>記録後</span>
          </div>
        </div>
      </div>

      {/* Emotion Distribution */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-4">感情の分布</h4>
        <div className="space-y-3">
          {emotionData.map((emotion, index) => {
            const maxCount = Math.max(...emotionData.map(e => e.count));
            const percentage = (emotion.count / maxCount) * 100;
            
            return (
              <div key={emotion.type} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: getEmotionColor(emotion.type) }}
                  ></div>
                  <span className="text-sm font-medium">{emotion.type}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                    <div 
                      className="h-2 rounded-full"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: getEmotionColor(emotion.type)
                      }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-8">{emotion.count}回</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getEmotionColor(type: string): string {
  const colors = {
    "怒り": "#ef4444",
    "不安": "#f59e0b", 
    "悲しみ": "#3b82f6",
    "イライラ": "#f97316",
    "焦り": "#8b5cf6",
    "恐怖": "#6b7280",
    "失望": "#64748b"
  };
  return colors[type as keyof typeof colors] || "#6b7280";
}
