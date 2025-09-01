import { detectDistortions, getDistortionTypeLabel } from "@shared/cognitive-distortion-logic";
import { CognitiveDistortion } from "@shared/schema";

export class CognitiveDistortionService {
  detectDistortions(thoughts: string, situation: string = "", evidence: string = ""): CognitiveDistortion[] {
    return detectDistortions(thoughts, situation, evidence);
  }

  getDistortionTypeLabel(type: string): string {
    return getDistortionTypeLabel(type);
  }
}

export const cognitiveDistortionService = new CognitiveDistortionService();
