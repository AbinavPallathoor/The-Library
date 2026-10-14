import {it,expect} from 'vitest';
import {VaultIndex} from '../../src/index/vault-index';
import {notebooks} from '../../src/notebooks/model';
import {topicTrail} from '../../src/notebooks/breadcrumbs';
it('uses nested hubs but does not turn ordinary related notes into parents', () => {
 const i = new VaultIndex();
 i.upsert('Learnings/Networking.md','---\ntags: [hub]\n---\n[[Protocols]]');
 i.upsert('Learnings/Protocols.md','---\ntags: [hub]\n---\n[[TCP]]');
 i.upsert('Learnings/TCP.md','[[Related]]');
 i.upsert('Learnings/Related.md','[[TCP]]');
 expect(topicTrail(i,notebooks(i)[0],'Learnings/TCP.md').map(n=>n.title)).toEqual(['Networking','Protocols','TCP']);
});
it('terminates on hub cycles and respects notebook boundaries', () => {
 const i = new VaultIndex();
 i.upsert('A/One.md','---\ntags: [hub]\n---\n[[Two]]');
 i.upsert('A/Two.md','---\ntags: [hub]\n---\n[[One]]');
 i.upsert('B/Other.md','---\ntags: [hub]\n---\n[[A/Target]]');
 i.upsert('A/Target.md','Content');
 expect(topicTrail(i,notebooks(i)[0],'A/Target.md').map(n=>n.title)).toEqual(['Target']);
});
