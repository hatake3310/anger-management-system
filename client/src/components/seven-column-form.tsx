import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  insertAngerRecordSchema,
  type Emotion,
  type CognitiveDistortion,
  type CopingPlan,
  type FollowUpReview,
  type AngerRecord,
  cognitiveDistortionSchema,
  copingPlanSchema,
  followUpReviewSchema,
} from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Edit, Plus, RotateCcw, Save } from "lucide-react";
import { z } from "zod";
import CognitiveDistortionAnalysis from "./cognitive-distortion-analysis";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

const formSchema = insertAngerRecordSchema.extend({
  emotions: z.array(z.object({
    type: z.string().min(1, "感情を選択してください"),
    intensity: z.number().min(0).max(100)
  })).min(1, "少なくとも1つの感情を入力してください"),
  detectedDistortions: z.array(cognitiveDistortionSchema),
  copingPlans: z.array(copingPlanSchema),
  followUpReview: followUpReviewSchema.optional().nullable()
});

type FormData = z.infer<typeof formSchema>;

export default function SevenColumnForm() {
  const [emotions, setEmotions] = useState<Emotion[]>([
    { type: "怒り", intensity: 50 }
  ]);
  const [moodBefore, setMoodBefore] = useState(70);
  const [moodAfter, setMoodAfter] = useState(30);
  const [detectedDistortions, setDetectedDistortions] = useState<CognitiveDistortion[]>([]);
  const [copingPlans, setCopingPlans] = useState<CopingPlan[]>([]);
  const [followUpReview, setFollowUpReview] = useState<FollowUpReview | null>(null);

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
      detectedDistortions: [],
      copingPlans: [],
      followUpReview: null
    }
  });

  const thoughtsValue = form.watch("thoughts");
  const situationValue = form.watch("situation");
  const evidenceValue = form.watch("evidence");

  const generatePlanId = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `plan-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const getDistortionKey = (distortion: CognitiveDistortion) =>
    [distortion.type, distortion.description, distortion.suggestion]
      .map((value) => value.trim().toLowerCase())
      .join("::");

  const createPlanFromDistortion = (distortion: CognitiveDistortion): CopingPlan => ({
    id: generatePlanId(),
    distortionType: distortion.type,
    suggestion: distortion.suggestion,
    action: distortion.suggestion,
    willTry: true,
    supportNotes: "",
    distortionKey: getDistortionKey(distortion),
  });

  const createFollowUpTemplate = (): FollowUpReview | null => {
    if (!latestRecord || previousCopingPlans.length === 0) return null;

    const actionablePlans = previousCopingPlans.filter((plan) => plan.willTry);
    if (actionablePlans.length === 0) return null;

    return {
      previousRecordId: latestRecord.id,
      items: actionablePlans.map((plan) => ({
        planId: plan.id,
        planSummary: plan.action.trim() || plan.suggestion,
        attempted: false,
        notes: "",
      })),
      reflection: "",
    };
  };

  const { data: latestRecord } = useQuery<AngerRecord | null>({
    queryKey: ["/api/anger-records", "latest"],
    queryFn: async () => {
      const response = await fetch("/api/anger-records?limit=1");
      if (!response.ok) throw new Error("Failed to fetch latest record");
      const records = await response.json();
      return Array.isArray(records) && records.length > 0 ? records[0] : null;
    },
  });

  const previousCopingPlans = useMemo(() => {
    if (!latestRecord || !latestRecord.copingPlans) return [] as CopingPlan[];
    try {
      const parsed = JSON.parse(latestRecord.copingPlans) as CopingPlan[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [] as CopingPlan[];
    }
  }, [latestRecord]);

  const previousPlanMap = useMemo(() => {
    return new Map(previousCopingPlans.map((plan) => [plan.id, plan]));
  }, [previousCopingPlans]);

  useEffect(() => {
    const template = createFollowUpTemplate();

    if (!template) {
      if (followUpReview !== null) {
        setFollowUpReview(null);
        form.setValue("followUpReview", null, { shouldDirty: false });
      }
      return;
    }

    if (!followUpReview || followUpReview.previousRecordId !== template.previousRecordId) {
      setFollowUpReview(template);
      form.setValue("followUpReview", template, { shouldDirty: false });
    }
  }, [latestRecord, previousCopingPlans, followUpReview, form]);

  const getDistortionLabel = (type: string): string => {
    const labels: Record<string, string> = {
      labeling: "ラベリング",
      mind_reading: "読心",
      all_or_nothing: "白黒思考",
      personalization: "個人化",
      externalization: "外部化",
    };

    return labels[type] ?? type;
  };

  const syncCopingPlans = (updater: (plans: CopingPlan[]) => CopingPlan[]) => {
    setCopingPlans((prev) => {
      const next = updater(prev);
      form.setValue("copingPlans", next, { shouldDirty: true });
      return next;
    });
  };

  const handleDistortionsChange = (distortions: CognitiveDistortion[]) => {
    setDetectedDistortions(distortions);
    form.setValue("detectedDistortions", distortions, { shouldDirty: true });

    syncCopingPlans((prevPlans) => {
      const planMap = new Map<string, CopingPlan>();

      prevPlans.forEach((plan) => {
        const key = plan.distortionKey ?? `${plan.distortionType}::${plan.suggestion}`;
        planMap.set(key, plan);
        if (!plan.distortionKey) {
          planMap.set(plan.distortionType, plan);
        }
      });

      return distortions.map((distortion) => {
        const key = getDistortionKey(distortion);
        const existing = planMap.get(key) ?? planMap.get(distortion.type);

        if (existing) {
          const suggestionChanged = existing.suggestion !== distortion.suggestion;
          const shouldUpdateAction = suggestionChanged && existing.action.trim() === existing.suggestion.trim();

          return {
            ...existing,
            distortionType: distortion.type,
            suggestion: distortion.suggestion,
            distortionKey: key,
            action: shouldUpdateAction ? distortion.suggestion : existing.action,
          };
        }

        return createPlanFromDistortion(distortion);
      });
    });
  };

  const handlePlanActionChange = (planId: string, value: string) => {
    syncCopingPlans((plans) =>
      plans.map((plan) => (plan.id === planId ? { ...plan, action: value } : plan))
    );
  };

  const handlePlanWillTryChange = (planId: string, willTry: boolean) => {
    syncCopingPlans((plans) =>
      plans.map((plan) => (plan.id === planId ? { ...plan, willTry } : plan))
    );
  };

  const handlePlanSupportNotesChange = (planId: string, value: string) => {
    syncCopingPlans((plans) =>
      plans.map((plan) => (plan.id === planId ? { ...plan, supportNotes: value } : plan))
    );
  };

  const syncFollowUpReview = (
    updater: (review: FollowUpReview | null) => FollowUpReview | null
  ) => {
    setFollowUpReview((prev) => {
      const next = updater(prev);
      form.setValue("followUpReview", next, { shouldDirty: true });
      return next;
    });
  };

  const handleFollowUpAttemptedChange = (planId: string, attempted: boolean) => {
    syncFollowUpReview((review) => {
      if (!review) return review;
      return {
        ...review,
        items: review.items.map((item) =>
          item.planId === planId ? { ...item, attempted } : item
        ),
      };
    });
  };

  const handleFollowUpNotesChange = (planId: string, value: string) => {
    syncFollowUpReview((review) => {
      if (!review) return review;
      return {
        ...review,
        items: review.items.map((item) =>
          item.planId === planId ? { ...item, notes: value } : item
        ),
      };
    });
  };

  const handleFollowUpReflectionChange = (value: string) => {
    syncFollowUpReview((review) => {
      if (!review) return review;
      return { ...review, reflection: value };
    });
  };

  const resetFormState = () => {
    const defaultEmotions: Emotion[] = [{ type: "怒り", intensity: 50 }];
    const followUpTemplate = createFollowUpTemplate();

    form.reset({
      date: new Date().toISOString().split("T")[0],
      situation: "",
      thoughts: "",
      evidence: "",
      counterEvidence: "",
      balancedThinking: "",
      moodBefore: 70,
      moodAfter: 30,
      emotions: defaultEmotions,
      detectedDistortions: [],
      copingPlans: [],
      followUpReview: followUpTemplate,
    });

    setEmotions(defaultEmotions);
    setMoodBefore(70);
    setMoodAfter(30);
    setDetectedDistortions([]);
    setCopingPlans([]);
    setFollowUpReview(followUpTemplate);
  };

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
      queryClient.invalidateQueries({ queryKey: ["/api/anger-records", "latest"] });
      resetFormState();
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
    const selectedPlans = copingPlans.filter((plan) => plan.willTry);
    const reviewToSave = followUpReview && followUpReview.items.length > 0
      ? followUpReview
      : null;

    mutation.mutate({
      ...data,
      emotions,
      moodBefore,
      moodAfter,
      detectedDistortions,
      copingPlans: selectedPlans,
      followUpReview: reviewToSave
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
              thoughts={thoughtsValue}
              situation={situationValue}
              evidence={evidenceValue}
              onDistortionsChange={handleDistortionsChange}
            />

            {/* Coping Plans */}
            <div className="rounded-lg border border-orange-100 bg-warm p-6 space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-xl">🧭</span>
                <div>
                  <h4 className="text-base font-semibold text-gray-900">対処プラン</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    AIが検出した認知の歪みに合わせて、実践したい行動プランを整理しましょう。
                  </p>
                </div>
              </div>

              {detectedDistortions.length === 0 ? (
                <div className="rounded-lg border border-dashed border-orange-200 bg-white p-4 text-sm text-gray-600">
                  自動思考を入力すると、ここにおすすめの対処プランを作成できます。
                </div>
              ) : (
                <div className="space-y-4">
                  {copingPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className="space-y-4 rounded-lg border border-orange-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className="border-orange-200 bg-orange-50 text-orange-700"
                          >
                            {getDistortionLabel(plan.distortionType)}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            ヒント: {plan.suggestion}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`plan-try-${plan.id}`}
                            checked={plan.willTry}
                            onCheckedChange={(checked) =>
                              handlePlanWillTryChange(plan.id, checked === true)
                            }
                          />
                          <Label htmlFor={`plan-try-${plan.id}`} className="text-sm text-gray-700">
                            今回このプランに取り組む
                          </Label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`plan-action-${plan.id}`} className="text-sm font-medium text-gray-700">
                          行動プランの内容
                        </Label>
                        <Textarea
                          id={`plan-action-${plan.id}`}
                          value={plan.action}
                          onChange={(event) => handlePlanActionChange(plan.id, event.target.value)}
                          placeholder="例：相手の意図を確認してから返答する、深呼吸を3回してから話す"
                          className="min-h-[80px]"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`plan-notes-${plan.id}`} className="text-xs font-medium text-gray-500">
                          サポートや準備メモ（任意）
                        </Label>
                        <Textarea
                          id={`plan-notes-${plan.id}`}
                          value={plan.supportNotes ?? ""}
                          onChange={(event) => handlePlanSupportNotesChange(plan.id, event.target.value)}
                          placeholder="例：同僚に相談する、事前に資料を読み込んでおく"
                          className="min-h-[60px]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Follow-up */}
            <div className="rounded-lg border border-teal-100 bg-teal-50 p-6 space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-xl">🔁</span>
                <div>
                  <h4 className="text-base font-semibold text-gray-900">フォローアップ</h4>
                  <p className="text-sm text-teal-700 mt-1">
                    前回の記録で立てたプランが実践できたかを振り返りましょう。
                  </p>
                </div>
              </div>

              {followUpReview && followUpReview.items.length > 0 && latestRecord ? (
                <div className="space-y-4">
                  <p className="text-xs text-teal-700">
                    対象の記録: {latestRecord.date} の対処プラン
                  </p>
                  {followUpReview.items.map((item) => {
                    const basePlan = previousPlanMap.get(item.planId);
                    return (
                      <div
                        key={item.planId}
                        className="space-y-3 rounded-lg border border-teal-200 bg-white p-4"
                      >
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div className="flex flex-wrap items-center gap-2">
                            {basePlan && (
                              <Badge
                                variant="outline"
                                className="border-teal-200 bg-teal-50 text-teal-700"
                              >
                                {getDistortionLabel(basePlan.distortionType)}
                              </Badge>
                            )}
                            <span className="text-sm text-gray-700">
                              {item.planSummary}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`follow-up-${item.planId}`}
                              checked={item.attempted}
                              onCheckedChange={(checked) =>
                                handleFollowUpAttemptedChange(item.planId, checked === true)
                              }
                            />
                            <Label htmlFor={`follow-up-${item.planId}`} className="text-sm text-gray-700">
                              試せた
                            </Label>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`follow-up-notes-${item.planId}`} className="text-xs font-medium text-gray-500">
                            メモ（結果や気づき）
                          </Label>
                          <Textarea
                            id={`follow-up-notes-${item.planId}`}
                            value={item.notes ?? ""}
                            onChange={(event) => handleFollowUpNotesChange(item.planId, event.target.value)}
                            placeholder="例：半分だけ実行できた／次回の課題 など"
                            className="min-h-[60px]"
                          />
                        </div>
                      </div>
                    );
                  })}

                  <div className="space-y-2">
                    <Label htmlFor="follow-up-reflection" className="text-sm font-medium text-gray-700">
                      全体の振り返りメモ（任意）
                    </Label>
                    <Textarea
                      id="follow-up-reflection"
                      value={followUpReview.reflection ?? ""}
                      onChange={(event) => handleFollowUpReflectionChange(event.target.value)}
                      placeholder="プランを実践してみて感じたことや次回の工夫を書き残しましょう"
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-teal-200 bg-white p-4 text-sm text-gray-600">
                  前回の記録で対処プランを保存すると、ここで振り返りができます。
                </div>
              )}
            </div>

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
                onClick={resetFormState}
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
