import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import RecordsList from "@/components/records-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { History as HistoryIcon, Download } from "lucide-react";
import { AngerRecord } from "@shared/schema";

export default function History() {
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [filterEmotion, setFilterEmotion] = useState("all");

  const { data: records, isLoading } = useQuery({
    queryKey: ["/api/anger-records"],
  });

  const exportRecords = () => {
    if (!records) return;
    
    const csvContent = [
      ["日付", "状況", "感情", "自動思考", "根拠", "反証", "バランス思考", "記録前気分", "記録後気分", "改善度"].join(","),
      ...records.map((record: AngerRecord) => [
        record.date,
        `"${record.situation.replace(/"/g, '""')}"`,
        `"${record.emotions.replace(/"/g, '""')}"`,
        `"${record.thoughts.replace(/"/g, '""')}"`,
        `"${record.evidence.replace(/"/g, '""')}"`,
        `"${record.counterEvidence.replace(/"/g, '""')}"`,
        `"${record.balancedThinking.replace(/"/g, '""')}"`,
        record.moodBefore,
        record.moodAfter,
        Math.round(((record.moodBefore - record.moodAfter) / record.moodBefore) * 100)
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `anger_records_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
      <Card className="border border-gray-100">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="flex items-center">
            <HistoryIcon className="text-primary h-5 w-5 mr-2" />
            記録履歴
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            過去の記録を確認し、パターンを把握しましょう
          </p>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全期間</SelectItem>
                <SelectItem value="week">今週</SelectItem>
                <SelectItem value="month">今月</SelectItem>
                <SelectItem value="quarter">過去3ヶ月</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterEmotion} onValueChange={setFilterEmotion}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての感情</SelectItem>
                <SelectItem value="怒り">怒り</SelectItem>
                <SelectItem value="不安">不安</SelectItem>
                <SelectItem value="悲しみ">悲しみ</SelectItem>
                <SelectItem value="イライラ">イライラ</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={exportRecords} className="flex items-center">
              <Download className="h-4 w-4 mr-2" />
              エクスポート
            </Button>
          </div>

          <RecordsList 
            records={records} 
            isLoading={isLoading}
            filterPeriod={filterPeriod}
            filterEmotion={filterEmotion}
          />
        </CardContent>
      </Card>
    </div>
  );
}
