// 必要なフック、コンポーネント、ライブラリをインポートします。
import { useState } from "react"; // Reactのstateを管理するためのフック
import { useForm } from "react-hook-form"; // フォームの状態管理とバリデーションを簡単にするためのライブラリ
import { zodResolver } from "@hookform/resolvers/zod"; // react-hook-formとZodを連携させるためのアダプター
import { useMutation, useQueryClient } from "@tanstack/react-query"; // サーバーデータの更新（作成、更新、削除）を扱うためのフック
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // UIコンポーネント（カード）
import { Button } from "@/components/ui/button"; // UIコンポーネント（ボタン）
import { Input } from "@/components/ui/input"; // UIコンポーネント（入力フィールド）
import { Textarea } from "@/components/ui/textarea"; // UIコンポーネント（テキストエリア）
import { Label } from "@/components/ui/label"; // UIコンポーネント（ラベル）
import { Slider } from "@/components/ui/slider"; // UIコンポーネント（スライダー）
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // UIコンポーネント（セレクトボックス）
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"; // フォーム関連のUIコンポーネント
import { insertAngerRecordSchema, type Emotion } from "@shared/schema"; // 共有スキーマ（データ構造の定義）
import { apiRequest } from "@/lib/queryClient"; // APIリクエストを送信するためのヘルパー関数
import { useToast } from "@/hooks/use-toast"; // トースト通知を表示するためのカスタムフック
import { Edit, Plus, RotateCcw, Save } from "lucide-react"; // アイコン
import { z } from "zod"; // データバリデーションのためのライブラリ
import CognitiveDistortionAnalysis from "./cognitive-distortion-analysis"; // 認知の歪み分析コンポーネント

// Zodを使ってフォームのバリデーションスキーマを定義します。
// 共有スキーマを拡張して、このフォーム特有のバリデーションルールを追加します。
const formSchema = insertAngerRecordSchema.extend({
  emotions: z.array(z.object({
    type: z.string().min(1, "感情を選択してください"),
    intensity: z.number().min(0).max(100)
  })).min(1, "少なくとも1つの感情を入力してください")
});

// ZodスキーマからTypeScriptの型を生成します。
type FormData = z.infer<typeof formSchema>;

/**
 * セブンコラム記録フォームのコンポーネント
 */
export default function SevenColumnForm() {
  // --- State管理 ---
  // 感情のリストを管理するためのstate。動的に追加・削除されるため、react-hook-formとは別で管理します。
  const [emotions, setEmotions] = useState<Emotion[]>([
    { type: "怒り", intensity: 50 }
  ]);
  // 「記録前の気分」スライダーの状態を管理
  const [moodBefore, setMoodBefore] = useState(70);
  // 「記録後の気分」スライダーの状態を管理
  const [moodAfter, setMoodAfter] = useState(30);
  
  // --- フックの初期化 ---
  const { toast } = useToast(); // トースト通知機能
  const queryClient = useQueryClient(); // TanStack Queryのクライアントインスタンス。キャッシュの無効化などに使用します。
  
  // react-hook-formの初期化
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema), // Zodスキーマをバリデーション解決策として設定
    defaultValues: { // フォームの初期値
      date: new Date().toISOString().split('T')[0], // 今日の日付
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

  // --- データ更新処理 (Mutation) ---
  // TanStack QueryのuseMutationを使って、サーバーへのデータ作成リクエストを定義します。
  const mutation = useMutation({
    // mutationFn: 実際にAPIリクエストを行う非同期関数
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/anger-records", data);
      return response.json();
    },
    // onSuccess: mutationが成功したときに実行されるコールバック
    onSuccess: () => {
      // 成功のトースト通知を表示
      toast({
        title: "記録が保存されました",
        description: "新しいアンガーマネジメント記録が正常に保存されました。",
      });
      // 関連するクエリを無効化して、データを再取得させます。
      // これにより、履歴一覧や統計情報が自動的に更新されます。
      queryClient.invalidateQueries({ queryKey: ["/api/anger-records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      // フォームをリセットして、次の入力に備えます。
      resetForm();
    },
    // onError: mutationが失敗したときに実行されるコールバック
    onError: () => {
      // エラーのトースト通知を表示
      toast({
        title: "エラー",
        description: "記録の保存に失敗しました。もう一度お試しください。",
        variant: "destructive",
      });
    }
  });

  // --- イベントハンドラ ---
  // フォームの送信ボタンが押されたときに実行される関数
  const onSubmit = (data: FormData) => {
    // mutationを実行して、サーバーにデータを送信します。
    // スライダーや感情リストの最新の状態をデータに含めます。
    mutation.mutate({
      ...data,
      emotions,
      moodBefore,
      moodAfter
    });
  };

  // 「感情を追加」ボタンが押されたときの処理
  const addEmotion = () => {
    setEmotions([...emotions, { type: "", intensity: 50 }]);
  };

  // 感情リストの項目が変更されたときの処理
  const updateEmotion = (index: number, field: keyof Emotion, value: string | number) => {
    const newEmotions = [...emotions];
    newEmotions[index] = { ...newEmotions[index], [field]: value };
    setEmotions(newEmotions);
  };

  // 感情を削除する処理
  const removeEmotion = (index: number) => {
    if (emotions.length > 1) { // 最後の1つは削除できないようにする
      setEmotions(emotions.filter((_, i) => i !== index));
    }
  };

  // フォーム全体を初期状態にリセットする処理
  const resetForm = () => {
    form.reset(); // react-hook-formの値をリセット
    // stateで管理している値もリセット
    setEmotions([{ type: "怒り", intensity: 50 }]);
    setMoodBefore(70);
    setMoodAfter(30);
  };

  // --- 派生データの計算 ---
  // 気分の改善度を計算します。
  const improvement = Math.round(((moodBefore - moodAfter) / moodBefore) * 100);

  // --- レンダリング (JSX) ---
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
        {/* react-hook-formのFormプロバイダー。フォーム全体をラップします。 */}
        <Form {...form}>
          {/* HTMLのform要素。onSubmitハンドラを設定します。 */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

            {/* 1. 日付 & 2. 状況 */}
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
                      <Textarea placeholder="何があったか、どこで、誰と..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 3. 感情と強さ */}
            <div>
              <Label className="flex items-center mb-4">
                <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold mr-2">3</span>
                感情と強さ
              </Label>
              <div className="space-y-4">
                {/* emotions stateをmapでループして、各感情の入力欄を描画します。 */}
                {emotions.map((emotion, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      {/* 感情の種類を選択するセレクトボックス */}
                      <Select 
                        value={emotion.type} 
                        onValueChange={(value) => updateEmotion(index, 'type', value)}
                      >
                        <SelectTrigger><SelectValue placeholder="感情を選択" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="怒り">怒り</SelectItem>
                          {/* ... 他にも感情の選択肢 ... */}
                        </SelectContent>
                      </Select>
                      
                      {/* 感情の強さを設定するスライダー */}
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-600">弱い</span>
                        <Slider
                          value={[emotion.intensity]}
                          onValueChange={(value) => updateEmotion(index, 'intensity', value[0])}
                        />
                        <span className="text-sm text-gray-600">強い</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="bg-primary text-white px-3 py-1 rounded-full text-sm font-medium">
                          {emotion.intensity}%
                        </span>
                        {/* 感情が2つ以上ある場合のみ削除ボタンを表示 */}
                        {emotions.length > 1 && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeEmotion(index)}>
                            削除
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {/* 感情を追加するボタン */}
                <Button type="button" variant="ghost" onClick={addEmotion}>
                  <Plus className="h-4 w-4 mr-2" />
                  感情を追加
                </Button>
              </div>
            </div>

            {/* 4. 自動思考 */}
            <FormField control={form.control} name="thoughts" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold mr-2">4</span>
                    自動思考
                  </FormLabel>
                  <FormControl>
                    <Textarea placeholder="頭に浮かんだ自動思考、ネガティブなセリフや信念" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
            )}/>

            {/* 5. 根拠 */}
            <FormField control={form.control} name="evidence" render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold mr-2">5</span>
                  根拠
                </FormLabel>
                <FormControl>
                  <Textarea placeholder="その思考や感情が事実に基づいているか？" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}/>

            {/* 6. 反証（反省） */}
            <FormField control={form.control} name="counterEvidence" render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold mr-2">6</span>
                  反証（反省）
                </FormLabel>
                <FormControl>
                  <Textarea placeholder="その思考とは矛盾する事実や例" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}/>

            {/* 7. バランス思考 */}
            <FormField control={form.control} name="balancedThinking" render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold mr-2">7</span>
                  バランス思考
                </FormLabel>
                <FormControl>
                  <Textarea placeholder="より事実に基づいた新たな現実的思考" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}/>

            {/* 気分の変化 */}
            <div>
              <Label className="flex items-center mb-4">💝 今の気分の変化</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 記録前の気分スライダー */}
                <div className="bg-red-50 p-4 rounded-lg">
                  <Label className="block text-sm font-medium text-red-700 mb-2">記録前の気分</Label>
                  <Slider value={[moodBefore]} onValueChange={(value) => setMoodBefore(value[0])} />
                  <div className="text-center mt-2"><span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">{moodBefore}% 悪い</span></div>
                </div>
                {/* 記録後の気分スライダー */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <Label className="block text-sm font-medium text-green-700 mb-2">記録後の気分</Label>
                  <Slider value={[moodAfter]} onValueChange={(value) => setMoodAfter(value[0])}/>
                  <div className="text-center mt-2"><span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">{moodAfter}% 悪い</span></div>
                </div>
              </div>
              {/* 改善度の表示 */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-800 font-medium">
                  📈 改善度: {improvement > 0 ? `${improvement}%改善` : "変化なし"}
                </div>
              </div>
            </div>

            {/* 認知の歪み分析コンポーネント */}
            {/* form.watchを使うことで、入力中のテキストをリアルタイムでこのコンポーネントに渡します。 */}
            <CognitiveDistortionAnalysis 
              thoughts={form.watch("thoughts")}
              situation={form.watch("situation")}
              evidence={form.watch("evidence")}
            />

            {/* フォーム操作ボタン */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              {/* 保存ボタン。mutationが実行中の場合は無効化し、テキストを変更します。 */}
              <Button type="submit" className="flex-1" disabled={mutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {mutation.isPending ? "保存中..." : "記録を保存"}
              </Button>
              {/* リセットボタン */}
              <Button type="button" variant="outline" className="flex-1" onClick={resetForm}>
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
