import { describe, expect, it } from 'vitest';
import source from '../../../content/guide.md?raw';
import { diffAtoms, guideStats, parseGuide } from './parseGuide';

describe('دليل الحل', () => {
  it('يحفظ إحصاءات المصدر ولا يسقط منه نصاً', () => {
    const doc = parseGuide(source);
    expect(guideStats(doc)).toMatchSnapshot();
    expect(diffAtoms(source, doc)).toEqual({ missing: [], extra: [] });
  });
});
