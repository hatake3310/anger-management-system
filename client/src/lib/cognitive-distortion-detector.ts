import { CognitiveDistortion } from "@shared/schema";

export class CognitiveDistortionDetector {
  static detectDistortions(thoughts: string, situation: string = "", evidence: string = ""): CognitiveDistortion[] {
    const distortions: CognitiveDistortion[] = [];
    const text = `${thoughts} ${situation} ${evidence}`.toLowerCase();

    // Labeling detection
    const labelingPatterns = [
      /あいつ/g, /やつ/g, /バカ/g, /ダメ/g, /無能/g, /最悪/g, /くそ/g, /うざい/g,
      /だめな人/g, /ひどい人/g, /最低/g
    ];
    
    if (labelingPatterns.some(pattern => pattern.test(text))) {
      distortions.push({
        type: "labeling",
        description: "相手や自分に否定的なレッテルを貼っています。",
        suggestion: "具体的な行動や事実に焦点を当てましょう。"
      });
    }

    // Mind reading detection
    const mindReadingPatterns = [
      /どうせ.*考えて/g, /きっと.*思っている/g, /.*に違いない/g, /絶対.*思っている/g,
      /どうせ.*ない/g, /.*はず/g, /間違いなく/g
    ];
    
    if (mindReadingPatterns.some(pattern => pattern.test(text))) {
      distortions.push({
        type: "mind_reading",
        description: "相手の気持ちや考えを推測で決めつけています。",
        suggestion: "確認せずに推測は控え、事実に基づいて判断しましょう。"
      });
    }

    // All-or-nothing thinking detection
    const allOrNothingPatterns = [
      /いつも/g, /必ず/g, /絶対/g, /全然/g, /まったく/g, /完全に/g, /全部/g,
      /一度も/g, /決して/g, /すべて/g
    ];
    
    if (allOrNothingPatterns.some(pattern => pattern.test(text))) {
      distortions.push({
        type: "all_or_nothing",
        description: "物事を極端に捉える白黒思考が見られます。",
        suggestion: "グレーゾーンや中間的な視点を探してみましょう。"
      });
    }

    // Personalization detection
    const personalizationPatterns = [
      /私のせい/g, /自分が悪い/g, /私が.*だから/g, /自分の責任/g,
      /私のミス/g, /自分が原因/g
    ];
    
    if (personalizationPatterns.some(pattern => pattern.test(text))) {
      distortions.push({
        type: "personalization",
        description: "すべてを自分のせいにする傾向があります。",
        suggestion: "他の要因や外部環境の影響も考慮してみましょう。"
      });
    }

    // Externalization detection
    const externalizationPatterns = [
      /相手が悪い/g, /環境のせい/g, /.*のせい/g, /運が悪い/g,
      /世の中が/g, /社会が/g, /他人が/g
    ];
    
    if (externalizationPatterns.some(pattern => pattern.test(text))) {
      distortions.push({
        type: "externalization",
        description: "すべてを外部要因のせいにする傾向があります。",
        suggestion: "自分でコントロールできる部分も探してみましょう。"
      });
    }

    return distortions;
  }

  static getDistortionTypeLabel(type: string): string {
    const labels = {
      labeling: "ラベリング",
      mind_reading: "読心",
      all_or_nothing: "白黒思考", 
      personalization: "個人化",
      externalization: "外部化"
    };
    return labels[type as keyof typeof labels] || type;
  }
}
