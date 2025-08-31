import { detectDistortions, getDistortionTypeLabel } from "@shared/cognitive-distortion-logic";
import { CognitiveDistortion } from "@shared/schema";

export class CognitiveDistortionDetector {
  static detectDistortions(thoughts: string, situation: string = "", evidence: string = ""): CognitiveDistortion[] {
    return detectDistortions(thoughts, situation, evidence);
  }

  static getDistortionTypeLabel(type: string): string {
    return getDistortionTypeLabel(type);
  }
}
