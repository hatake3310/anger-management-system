import { describe, it, expect } from 'vitest';
import { detectDistortions, getDistortionTypeLabel } from './cognitive-distortion-logic';

describe('Cognitive Distortion Logic', () => {
  describe('detectDistortions', () => {
    it('should detect labeling', () => {
      const text = 'あいつは本当にバカだ';
      const distortions = detectDistortions(text);
      expect(distortions).toHaveLength(1);
      expect(distortions[0].type).toBe('labeling');
    });

    it('should detect mind reading', () => {
      const text = '彼はどうせ私のことを嫌っているに違いない';
      const distortions = detectDistortions(text);
      expect(distortions).toHaveLength(1);
      expect(distortions[0].type).toBe('mind_reading');
    });

    it('should detect all-or-nothing thinking', () => {
      const text = 'いつも失敗ばかりだ';
      const distortions = detectDistortions(text);
      expect(distortions).toHaveLength(1);
      expect(distortions[0].type).toBe('all_or_nothing');
    });

    it('should detect personalization', () => {
      const text = 'このプロジェクトが遅れたのは私のせいです';
      const distortions = detectDistortions(text);
      expect(distortions).toHaveLength(1);
      expect(distortions[0].type).toBe('personalization');
    });

    it('should detect externalization', () => {
      const text = '私が成功しないのは環境のせいだ';
      const distortions = detectDistortions(text);
      expect(distortions).toHaveLength(1);
      expect(distortions[0].type).toBe('externalization');
    });

    it('should detect multiple distortions', () => {
      const text = 'いつも私のせいでダメになる';
      const distortions = detectDistortions(text);
      expect(distortions.length).toBeGreaterThanOrEqual(2);
      const types = distortions.map(d => d.type);
      expect(types).toContain('all_or_nothing');
      expect(types).toContain('personalization');
    });

    it('should return an empty array when no distortions are detected', () => {
      const text = '今日は天気が良いので散歩に行こう';
      const distortions = detectDistortions(text);
      expect(distortions).toHaveLength(0);
    });
  });

  describe('getDistortionTypeLabel', () => {
    it('should return the correct label for a known type', () => {
      expect(getDistortionTypeLabel('labeling')).toBe('ラベリング');
      expect(getDistortionTypeLabel('mind_reading')).toBe('読心');
      expect(getDistortionTypeLabel('all_or_nothing')).toBe('白黒思考');
      expect(getDistortionTypeLabel('personalization')).toBe('個人化');
      expect(getDistortionTypeLabel('externalization')).toBe('外部化');
    });

    it('should return the type itself for an unknown type', () => {
      expect(getDistortionTypeLabel('unknown_type')).toBe('unknown_type');
    });
  });
});
