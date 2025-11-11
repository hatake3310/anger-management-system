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
      suggestion: "レッテルではなく、具体的な行動に焦点を当ててみましょう。「彼は無能だ」ではなく、「彼の報告書には改善点があった」のように、具体的な事実を客観的に表現することで、より建設的な視点が生まれます。"
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
      suggestion: "相手の心を読もうとせず、事実に基づいて考えましょう。自分の推測が本当に正しいのか、相手に直接質問したり、客観的な証拠を探したりすることで、誤解を減らすことができます。"
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
      suggestion: "物事を0か100かで判断するのではなく、中間の視点を探してみましょう。「すべて失敗だ」ではなく、「この部分はうまくいったが、ここは改善できる」のように、部分的に評価することで、より現実的な捉え方ができます。"
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
      suggestion: "すべての責任を一人で背負うのではなく、他の要因も考慮に入れましょう。問題には、自分以外の様々な要因が関わっている可能性があります。出来事を客観的に分析し、責任の所在を現実的に評価することが大切です。"
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
      suggestion: "他人のせいや環境のせいにするだけでなく、自分にできることを見つけてみましょう。状況を変えるために自分がコントロールできる小さな一歩は何かを考えることで、主体的に問題解決に取り組むことができます。"
    });
  }

  // 6. べき思考 (Should Statements) の検出
  // 自分や他人に対して「～べきだ」「～べきでない」という厳しいルールを課し、それが満たされないときに怒りや罪悪感を感じる思考パターンを検出します。
  const shouldStatementPatterns = [
    /べき/g, /はずだ/g, /当然だ/g, /なければならない/g, /なくてはならない/g
  ];

  if (shouldStatementPatterns.some(pattern => pattern.test(text))) {
    distortions.push({
      type: "should_thinking",
      description: "自分や他人に対して「～べきだ」「～べきでない」と厳しいルールを課し、それが満たされないと怒りや罪悪感を感じています。",
      suggestion: "「～べき」という考えを、「～だといいな」「～したい」という柔軟な願望に置き換えてみましょう。これにより、自分や他人に対する過度な期待を手放し、心の負担を軽くすることができます。"
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
    externalization: "外部化",
    should_thinking: "べき思考"
  };
  // type文字列をキーとして、対応する日本語ラベルを返す
  // もし対応するラベルが見つからない場合は、元のtype文字列をそのまま返す
  return labels[type as keyof typeof labels] || type;
}
