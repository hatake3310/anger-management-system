import { AngerRecord, Emotion, CognitiveDistortion, CopingPlan, FollowUpReview } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface RecordsListProps {
  records?: AngerRecord[];
  isLoading: boolean;
  filterPeriod: string;
  filterEmotion: string;
}

export default function RecordsList({ records, isLoading, filterPeriod, filterEmotion }: RecordsListProps) {
  const [selectedRecord, setSelectedRecord] = useState<AngerRecord | null>(null);

  const filteredRecords = records?.filter(record => {
    // Filter by period
    if (filterPeriod !== "all") {
      const recordDate = new Date(record.date);
      const now = new Date();
      
      switch (filterPeriod) {
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (recordDate < weekAgo) return false;
          break;
        case "month":
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          if (recordDate < monthAgo) return false;
          break;
        case "quarter":
          const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          if (recordDate < quarterAgo) return false;
          break;
      }
    }

    // Filter by emotion
    if (filterEmotion !== "all") {
      try {
        const emotions = JSON.parse(record.emotions) as Emotion[];
        if (!emotions.some(emotion => emotion.type === filterEmotion)) return false;
      } catch {
        return false;
      }
    }

    return true;
  }) || [];

  const getEmotionBadges = (emotionsJson: string) => {
    try {
      const emotions = JSON.parse(emotionsJson) as Emotion[];
      return emotions.slice(0, 3).map((emotion, index) => (
        <Badge 
          key={index} 
          variant="secondary" 
          className={`text-xs ${getEmotionColor(emotion.type)}`}
        >
          {emotion.type} {emotion.intensity}%
        </Badge>
      ));
    } catch {
      return [];
    }
  };

  const getEmotionColor = (type: string) => {
    const colors = {
      "怒り": "bg-red-100 text-red-800",
      "不安": "bg-yellow-100 text-yellow-800",
      "悲しみ": "bg-blue-100 text-blue-800",
      "イライラ": "bg-orange-100 text-orange-800",
      "焦り": "bg-purple-100 text-purple-800"
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getDistortionDots = (distortionsJson: string) => {
    try {
      const distortions = JSON.parse(distortionsJson) as CognitiveDistortion[];
      return distortions.slice(0, 3).map((_, index) => (
        <span 
          key={index} 
          className="w-2 h-2 bg-accent rounded-full" 
          title="認知の歪み検出"
        />
      ));
    } catch {
      return [];
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-gray-200 h-24 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (!filteredRecords.length) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">記録がありません</p>
        <p className="text-gray-400 text-sm mt-2">
          新しい記録を追加して分析を始めましょう
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {filteredRecords.map((record) => {
          const improvement = Math.round(((record.moodBefore - record.moodAfter) / record.moodBefore) * 100);
          
          return (
            <Card 
              key={record.id} 
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setSelectedRecord(record)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="text-sm text-gray-600 mr-4">{record.date}</span>
                      <div className="flex space-x-2">
                        {getEmotionBadges(record.emotions)}
                      </div>
                    </div>
                    <p className="text-gray-900 font-medium mb-1 line-clamp-1">
                      {record.situation}
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {record.thoughts}
                    </p>
                  </div>
                  <div className="flex items-center ml-4">
                    <div className="text-right">
                      <div className="text-sm text-secondary font-medium">
                        {improvement > 0 ? `${improvement}% 改善` : "変化なし"}
                      </div>
                      <div className="flex space-x-1 mt-1">
                        {getDistortionDots(record.detectedDistortions)}
                      </div>
                    </div>
                    <ChevronRight className="text-gray-400 ml-2 h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Record Detail Modal */}
      <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>記録詳細 - {selectedRecord?.date}</DialogTitle>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">状況</h4>
                <p className="text-sm text-gray-600">{selectedRecord.situation}</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">感情</h4>
                <div className="space-y-2">
                  {getEmotionBadges(selectedRecord.emotions)}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">自動思考</h4>
                <p className="text-sm text-gray-600">{selectedRecord.thoughts}</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">根拠</h4>
                <p className="text-sm text-gray-600">{selectedRecord.evidence}</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">反証</h4>
                <p className="text-sm text-gray-600">{selectedRecord.counterEvidence}</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">バランス思考</h4>
                <p className="text-sm text-gray-600">{selectedRecord.balancedThinking}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">記録前の気分</h4>
                  <p className="text-2xl font-bold text-red-600">{selectedRecord.moodBefore}%</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">記録後の気分</h4>
                  <p className="text-2xl font-bold text-green-600">{selectedRecord.moodAfter}%</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">検出された認知の歪み</h4>
                {(() => {
                  try {
                    const distortions = JSON.parse(selectedRecord.detectedDistortions) as CognitiveDistortion[];
                    return distortions.length > 0 ? (
                      <div className="space-y-2">
                        {distortions.map((distortion, index) => (
                          <div key={index} className="p-3 bg-warm rounded-lg border border-orange-200">
                            <p className="font-medium">{getDistortionLabel(distortion.type)}</p>
                            <p className="text-sm text-gray-600">{distortion.description}</p>
                            <p className="text-sm text-accent font-medium mt-1">
                              💡 {distortion.suggestion}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-green-600">認知の歪みは検出されませんでした</p>
                    );
                  } catch {
                    return <p className="text-sm text-gray-500">分析データなし</p>;
                  }
                })()}
              </div>

              <div>
                <h4 className="font-semibold mb-2">対処プラン</h4>
                {(() => {
                  try {
                    const plans = JSON.parse(selectedRecord.copingPlans) as CopingPlan[];
                    if (!plans || plans.length === 0) {
                      return <p className="text-sm text-gray-500">登録された対処プランはありません。</p>;
                    }

                    return (
                      <div className="space-y-2">
                        {plans.map((plan) => (
                          <div key={plan.id} className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-800">
                                {getDistortionLabel(plan.distortionType)}
                              </span>
                              {plan.willTry ? (
                                <Badge variant="outline" className="border-orange-300 text-orange-700">
                                  実行予定
                                </Badge>
                              ) : null}
                            </div>
                            <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">{plan.action}</p>
                            {plan.supportNotes && (
                              <p className="mt-2 text-xs text-gray-500">補足: {plan.supportNotes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  } catch {
                    return <p className="text-sm text-gray-500">プラン情報を読み取れませんでした。</p>;
                  }
                })()}
              </div>

              <div>
                <h4 className="font-semibold mb-2">フォローアップ</h4>
                {(() => {
                  if (!selectedRecord.followUpReview) {
                    return <p className="text-sm text-gray-500">フォローアップ記録はまだありません。</p>;
                  }

                  try {
                    const review = JSON.parse(selectedRecord.followUpReview) as FollowUpReview;
                    if (!review || !review.items || review.items.length === 0) {
                      return <p className="text-sm text-gray-500">フォローアップ記録はまだありません。</p>;
                    }

                    const planLookup = (() => {
                      try {
                        const plans = JSON.parse(selectedRecord.copingPlans) as CopingPlan[];
                        return new Map(plans.map((plan) => [plan.id, plan]));
                      } catch {
                        return new Map<string, CopingPlan>();
                      }
                    })();

                    return (
                      <div className="space-y-3">
                        {review.items.map((item) => {
                          const plan = planLookup.get(item.planId);
                          return (
                            <div key={item.planId} className="rounded-lg border border-teal-200 bg-teal-50 p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-700">
                                    {plan ? getDistortionLabel(plan.distortionType) : "プラン"}
                                  </p>
                                  <p className="text-sm text-gray-600 mt-1">{item.planSummary}</p>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={item.attempted ? "border-teal-300 text-teal-700" : "border-gray-300 text-gray-600"}
                                >
                                  {item.attempted ? "実行" : "未実行"}
                                </Badge>
                              </div>
                              {item.notes && (
                                <p className="mt-2 text-xs text-gray-600 whitespace-pre-line">メモ: {item.notes}</p>
                              )}
                            </div>
                          );
                        })}
                        {review.reflection && (
                          <div className="rounded-lg border border-teal-200 bg-white p-3">
                            <p className="text-xs text-gray-600 whitespace-pre-line">全体メモ: {review.reflection}</p>
                          </div>
                        )}
                      </div>
                    );
                  } catch {
                    return <p className="text-sm text-gray-500">フォローアップ情報を読み取れませんでした。</p>;
                  }
                })()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
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
