import { CognitiveDistortion } from "./schema";

/**
 * 入力されたテキストから認知の歪みを検出します。
 * @param thoughts - 分析対象の思考や感情のテキスト。
 * @param situation - （任意）思考が起こった状況のテキスト。
 * @param evidence - （任意）その思考を裏付ける証拠のテキスト。
 * @returns 検出された認知の歪みのリスト。歪みがなければ空の配列を返します。
 */
export function detectDistortions(thoughts: string, situation: string = "", evidence: string = ""): CognitiveDistortion[] {
  // 検出された認知の歪みを格納するための配列
  const distortions: CognitiveDistortion[] = [];
  // 入力されたすべてのテキストを結合し、小文字に変換して検索しやすくする
  const text = `${thoughts} ${situation} ${evidence}`.toLowerCase();

  // --- 認知の歪み検出ロジック ---

  // 1. ラベリング (Labeling) の検出
  // 自分や他人に対して、一つの側面だけを見て否定的なレッテルを貼る思考パターンを検出します。
  const labelingPatterns = [
    /あいつ/g, /やつ/g, /バカ/g, /ダメ/g, /無能/g, /最悪/g, /くそ/g, /うざい/g,
    /だめな人/g, /ひどい人/g, /最低/g
  ];

  // パターンのいずれかがテキストに含まれているかチェック
  if (labelingPatterns.some(pattern => pattern.test(text))) {
    distortions.push({
      type: "labeling",
      description: "相手や自分に否定的なレッテルを貼っています。",
      suggestion: "具体的な行動や事実に焦点を当てましょう。"
    });
  }

  // 2. 読心術 (Mind Reading) の検出
  // 十分な根拠がないのに、他人が考えていることや感じていることを一方的に推測し、決めつける思考パターンを検出します。
  const mindReadingPatterns = [
    /どうせ.*考えて/g, /きっと.*思っている/g, /.*に違いない/g, /絶対.*思っている/g,
    /どうせ.*ない/g, /.*はず/g, /間違いなく/g
  ];

  // パターンのいずれかがテキストに含まれているかチェック
  if (mindReadingPatterns.some(pattern => pattern.test(text))) {
    distortions.push({
      type: "mind_reading",
      description: "相手の気持ちや考えを推測で決めつけています。",
      suggestion: "確認せずに推測は控え、事実に基づいて判断しましょう。"
    });
  }

  // 3. 白黒思考 (All-or-Nothing Thinking) の検出
  // 物事を「すべて」か「ゼロ」か、白か黒か、といった極端な二者択一で捉える思考パターンを検出します。
  const allOrNothingPatterns = [
    /いつも/g, /必ず/g, /絶対/g, /全然/g, /まったく/g, /完全に/g, /全部/g,
    /一度も/g, /決して/g, /すべて/g
  ];

  // パターンのいずれかがテキストに含まれているかチェック
  if (allOrNothingPatterns.some(pattern => pattern.test(text))) {
    distortions.push({
      type: "all_or_nothing",
      description: "物事を極端に捉える白黒思考が見られます。",
      suggestion: "グレーゾーンや中間的な視点を探してみましょう。"
    });
  }

  // 4. 個人化 (Personalization) の検出
  // 自分に直接関係のないネガティブな出来事まで、すべて自分のせいだと考えてしまう思考パターンを検出します。
  const personalizationPatterns = [
    /私のせい/g, /自分が悪い/g, /私が.*だから/g, /自分の責任/g,
    /私のミス/g, /自分が原因/g
  ];

  // パターンのいずれかがテキストに含まれているかチェック
  if (personalizationPatterns.some(pattern => pattern.test(text))) {
    distortions.push({
      type: "personalization",
      description: "すべてを自分のせいにする傾向があります。",
      suggestion: "他の要因や外部環境の影響も考慮してみましょう。"
    });
  }

  // 5. 外部化 (Externalization) の検出
  // 問題の原因をすべて自分以外の要因（他人、環境など）のせいにする思考パターンを検出します。
  const externalizationPatterns = [
      /相手が悪い/g, /環境のせい/g, /運が悪い/g,
    /世の中が/g, /社会が/g, /他人が/g
  ];

  // パターンのいずれかがテキストに含まれているかチェック
  if (externalizationPatterns.some(pattern => pattern.test(text))) {
    distortions.push({
      type: "externalization",
      description: "すべてを外部要因のせいにする傾向があります。",
      suggestion: "自分でコントロールできる部分も探してみましょう。"
    });
  }

  // 検出された歪みのリストを返す
  return distortions;
}

/**
 * 認知の歪みの種類（type）を、対応する日本語のラベルに変換します。
 * @param type - 認知の歪みの種類を示す文字列（例: "labeling"）。
 * @returns 日本語のラベル文字列（例: "ラベリング"）。対応するラベルがない場合は、元のtype文字列をそのまま返します。
 */
export function getDistortionTypeLabel(type: string): string {
  const labels = {
    labeling: "ラベリング",
    mind_reading: "読心",
    all_or_nothing: "白黒思考",
    personalization: "個人化",
    externalization: "外部化"
  };
  // type文字列をキーとして、対応する日本語ラベルを返す
  // もし対応するラベルが見つからない場合は、元のtype文字列をそのまま返す
  return labels[type as keyof typeof labels] || type;
}
