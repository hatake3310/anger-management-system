import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CognitiveDistortion } from "@shared/schema";

interface CognitiveDistortionAnalysisProps {
  thoughts: string;
  situation: string;
  evidence: string;
}

export default function CognitiveDistortionAnalysis({
  thoughts,
  situation,
  evidence
}: CognitiveDistortionAnalysisProps) {
  const { data: distortions, isLoading } = useQuery({
    queryKey: ["/api/analyze-distortions", thoughts, situation, evidence],
    queryFn: async () => {
      if (!thoughts.trim()) return [];
      
      const response = await fetch("/api/analyze-distortions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thoughts, situation, evidence }),
      });
      
      if (!response.ok) throw new Error("Failed to analyze distortions");
      return response.json() as CognitiveDistortion[];
    },
    enabled: !!thoughts.trim(),
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

  const getDistortionColor = (type: string): string => {
    const colors = {
      labeling: "bg-red-100 text-red-800",
      mind_reading: "bg-blue-100 text-blue-800",
      all_or_nothing: "bg-purple-100 text-purple-800",
      personalization: "bg-yellow-100 text-yellow-800",
      externalization: "bg-green-100 text-green-800"
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  if (!thoughts.trim()) {
    return (
      <Card className="bg-warm border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Brain className="text-accent h-5 w-5 mr-2" />
            認知の歪み分析（AI検出）
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            自動思考を入力すると、AIが認知の歪みを自動検出します。
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-warm border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Brain className="text-accent h-5 w-5 mr-2" />
          認知の歪み分析（AI検出）
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent"></div>
            <span className="text-sm text-gray-600">分析中...</span>
          </div>
        ) : distortions && distortions.length > 0 ? (
          <div className="space-y-3">
            {distortions.map((distortion, index) => (
              <div key={index} className="flex items-start p-3 bg-white rounded-lg border border-orange-100">
                <div className="flex-shrink-0 w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900">
                      {getDistortionLabel(distortion.type)}
                    </h5>
                    <Badge className={getDistortionColor(distortion.type)}>
                      {getDistortionLabel(distortion.type)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{distortion.description}</p>
                  <div className="mt-2">
                    <Badge variant="outline" className="bg-accent/10 text-accent border-accent">
                      改善のヒント: {distortion.suggestion}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-sm text-green-800">
              <strong>素晴らしいです！</strong> 明らかな認知の歪みは検出されませんでした。バランスの取れた思考ができているようです。
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
