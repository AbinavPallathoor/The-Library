import { describe, it, expect, vi, afterEach } from 'vitest';
import { graphQuery, notebookConnections, NotebookGraphFocus } from '../../src/graph/focus';
afterEach(() => vi.useRealTimers());
describe('notebook graph focus', () => {
  it('includes direct links in both directions without recursively including the vault', () => {
    expect(notebookConnections(['A.md'], {'A.md': {'B.md': 1}, 'B.md': {'C.md': 1}, 'D.md': {'A.md': 1}})).toEqual(['A.md', 'B.md', 'D.md']);
  });
  it('escapes search regex syntax and anchors entire paths', () => {
    const query = graphQuery(['Learnings/A (1)+.md']);
    const regex = new RegExp(query.slice(6, -1));
    expect(regex.test('Learnings/A (1)+.md')).toBe(true);
    expect(regex.test('Other/Learnings/A (1)+.md')).toBe(false);
    expect(new RegExp(graphQuery([]).slice(6, -1)).test('anything')).toBe(false);
  });
  it('filters and fits a core graph, then restores its original options and pan', () => {
    vi.useFakeTimers();
    const original = {search: 'tag:#personal', scale: .5, showOrphans: false};
    const dataEngine = {getOptions: () => original, setOptions: vi.fn(), updateSearch: vi.fn()};
    const renderer = {nodes: [{id:'A.md',x:200,y:100},{id:'B.md',x:400,y:100}], width:600,height:400,panX:42,panY:43,targetScale:.5,zoomTo:vi.fn(),setScale:vi.fn(),setPan:vi.fn(),changed:vi.fn()};
    const controller = new NotebookGraphFocus({getLeavesOfType: () => [{view:{dataEngine,renderer}}]}, {resolvedLinks:{'A.md':{'B.md':1}}});
    controller.focus(['A.md']);
    expect(dataEngine.setOptions.mock.calls[0][0].search).toBe(graphQuery(['A.md','B.md']));
    vi.advanceTimersByTime(300);
    expect(renderer.zoomTo).toHaveBeenCalled();
    expect(renderer.setPan.mock.calls[0][0]).toBeCloseTo(300-300*(600/380));
    controller.restore();
    expect(dataEngine.setOptions).toHaveBeenLastCalledWith(original);
    expect(renderer.setPan).toHaveBeenLastCalledWith(42,43);
    const count = renderer.zoomTo.mock.calls.length;
    vi.runAllTimers();
    expect(renderer.zoomTo).toHaveBeenCalledTimes(count);
  });
  it('does nothing to missing or incompatible graph implementations', () => {
    const controller = new NotebookGraphFocus({getLeavesOfType: () => [{view:{renderer:{}}}]}, {resolvedLinks:{}});
    expect(() => {controller.focus(['A.md']);controller.restore();}).not.toThrow();
  });
});
