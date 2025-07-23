import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertAngerRecordSchema, type Emotion } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Edit, Plus, RotateCcw, Save } from "lucide-react";
import { z } from "zod";
import CognitiveDistortionAnalysis from "./cognitive-distortion-analysis";

const formSchema = insertAngerRecordSchema.extend({
  emotions: z.array(z.object({
    type: z.string().min(1, "感情を選択してください"),
    intensity: z.number().min(0).max(100)
  })).min(1, "少なくとも1つの感情を入力してください")
});

type FormData = z.infer<typeof formSchema>;

export default function SevenColumnForm() {
  const [emotions, setEmotions] = useState<Emotion[]>([
    { type: "怒り", intensity: 50 }
  ]);
  const [moodBefore, setMoodBefore] = useState(70);
  const [moodAfter, setMoodAfter] = useState(30);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      situation: "",
      thoughts: "",
      evidence: "",
      counterEvidence: "",
      balancedThinking: "",
      moodBefore,
      moodAfter,
      emotions,
      detectedDistortions: []
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/anger-records", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "記録が保存されました",
        description: "新しいアンガーマネジメント記録が正常に保存されました。",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/anger-records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      form.reset();
      setEmotions([{ type: "怒り", intensity: 50 }]);
      setMoodBefore(70);
      setMoodAfter(30);
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "記録の保存に失敗しました。もう一度お試しください。",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate({
      ...data,
      emotions,
      moodBefore,
      moodAfter
    });
  };

  const addEmotion = () => {
    setEmotions([...emotions, { type: "", intensity: 50 }]);
  };

  const updateEmotion = (index: number, field: keyof Emotion, value: string | number) => {
    const newEmotions = [...emotions];
    newEmotions[index] = { ...newEmotions[index], [field]: value };
    setEmotions(newEmotions);
  };

  const removeEmotion = (index: number) => {
    if (emotions.length > 1) {
      setEmotions(emotions.filter((_, i) => i !== index));
    }
  };

  const resetForm = () => {
    form.reset();
    setEmotions([{ type: "怒り", intensity: 50 }]);
    setMoodBefore(70);
    setMoodAfter(30);
  };

  const improvement = Math.round(((moodBefore - moodAfter) / moodBefore) * 100);

  return (
    <Card className="border border-gray-100">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="flex items-center">
          <Edit className="text-primary h-5 w-5 mr-2" />
          セブンコラム記録
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          感情とその背景にある思考を客観的に記録し、分析しましょう
        </p>
      </CardHeader>
      
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Date and Situation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold mr-2">1</span>
                      日付
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="situation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold mr-2">2</span>
                      状況
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        className="h-24 resize-none" 
                        placeholder="何があったか、どこで、誰と、何が起きたのかなど具体的な出来事を記録してください"
                        {...field} 
                      />
                    </FormControl>
                    <div className="text-xs text-gray-500">
                      例：上司からプレゼンの資料を直すように言われたが、前日に言っていたことと話が全然違う
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Emotions */}
            <div>
              <Label className="flex items-center mb-4">
                <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold mr-2">3</span>
                感情と強さ
              </Label>
              <div className="space-y-4">
                {emotions.map((emotion, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <Select 
                        value={emotion.type} 
                        onValueChange={(value) => updateEmotion(index, 'type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="感情を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="怒り">怒り</SelectItem>
                          <SelectItem value="不安">不安</SelectItem>
                          <SelectItem value="悲しみ">悲しみ</SelectItem>
                          <SelectItem value="焦り">焦り</SelectItem>
                          <SelectItem value="イライラ">イライラ</SelectItem>
                          <SelectItem value="恐怖">恐怖</SelectItem>
                          <SelectItem value="失望">失望</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-600">弱い</span>
                        <Slider
                          value={[emotion.intensity]}
                          onValueChange={(value) => updateEmotion(index, 'intensity', value[0])}
                          max={100}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-sm text-gray-600">強い</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="bg-primary text-white px-3 py-1 rounded-full text-sm font-medium">
                          {emotion.intensity}%
                        </span>
                        {emotions.length > 1 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeEmotion(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            削除
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={addEmotion}
                  className="text-primary hover:text-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  感情を追加
                </Button>
              </div>
            </div>

            {/* Automatic Thoughts */}
            <FormField
              control={form.control}
              name="thoughts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold mr-2">4</span>
                    自動思考
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      className="h-24 resize-none" 
                      placeholder="頭に浮かんだ自動思考、ネガティブなセリフや信念"
                      {...field} 
                    />
                  </FormControl>
                  <div className="text-xs text-gray-500">
                    例：このあいだもまったく違うことを言っていた。なんだあいつは！どうせ部下のことなんてなんも考えてない。
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Evidence */}
            <FormField
              control={form.control}
              name="evidence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold mr-2">5</span>
                    根拠
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      className="h-24 resize-none" 
                      placeholder="その思考や感情が事実に基づいているか？根拠や証拠となること"
                      {...field} 
                    />
                  </FormControl>
                  <div className="space-y-2 mt-2">
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="text-sm text-red-800">
                        <strong>NG例：</strong>上司に怒られた → 自分は無能だ（←思い込み）
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-sm text-green-800">
                        <strong>OK例：</strong>確かにプレゼンにミスがあったが、他の人も同様のミスをしていた。明確な証拠がない限り、無能と断定できない。
                      </div>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Counter Evidence */}
            <FormField
              control={form.control}
              name="counterEvidence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold mr-2">6</span>
                    反証（反省）
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      className="h-24 resize-none" 
                      placeholder="その思考とは矛盾する事実や例。客観的に見てどうか？"
                      {...field} 
                    />
                  </FormControl>
                  <div className="text-xs text-gray-500 mt-1">
                    例：いつも失敗していると思ったが、先月のプレゼンは成功だった。
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Balanced Thinking */}
            <FormField
              control={form.control}
              name="balancedThinking"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold mr-2">7</span>
                    バランス思考
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      className="h-24 resize-none" 
                      placeholder="より事実に基づいた新たな現実的思考"
                      {...field} 
                    />
                  </FormControl>
                  <div className="text-xs text-gray-500 mt-1">
                    例：上司に怒られたが、過去には褒められたこともある。たまたま機嫌が悪かっただけかもしれない。
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Mood Changes */}
            <div>
              <Label className="flex items-center mb-4">
                <span className="text-primary mr-2">💝</span>
                今の気分の変化
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-red-50 p-4 rounded-lg">
                  <Label className="block text-sm font-medium text-red-700 mb-2">記録前の気分</Label>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600">良い</span>
                    <Slider
                      value={[moodBefore]}
                      onValueChange={(value) => setMoodBefore(value[0])}
                      max={100}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-600">悪い</span>
                  </div>
                  <div className="text-center mt-2">
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {moodBefore}% 悪い
                    </span>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <Label className="block text-sm font-medium text-green-700 mb-2">記録後の気分</Label>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600">良い</span>
                    <Slider
                      value={[moodAfter]}
                      onValueChange={(value) => setMoodAfter(value[0])}
                      max={100}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-600">悪い</span>
                  </div>
                  <div className="text-center mt-2">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {moodAfter}% 悪い
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-800 font-medium">
                  📈 改善度: {improvement > 0 ? `${improvement}%改善` : "変化なし"}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  例：イライラが60%→30%に減少。不安が70%改善。
                </div>
              </div>
            </div>

            {/* Cognitive Distortion Analysis */}
            <CognitiveDistortionAnalysis 
              thoughts={form.watch("thoughts")}
              situation={form.watch("situation")}
              evidence={form.watch("evidence")}
            />

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={mutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {mutation.isPending ? "保存中..." : "記録を保存"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1" 
                onClick={resetForm}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                リセット
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
