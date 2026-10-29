import Reveal, { Counter } from '@/components/ui/Reveal';
import Blossom from '@/components/ui/Blossom';
import { Mark } from '@/components/Header';
import { manifesto } from '@/lib/content';

export default function Manifesto() {
  return (
    <section className="section manifesto" id="residence">
      <Blossom seed={79} className="manifesto__branch" />
      <Blossom seed={10} from="bottom" className="manifesto__branch manifesto__branch--left" />

      <div className="manifesto__head label">
        <span className="section-index">01</span>
        <span>{manifesto.label}</span>
      </div>

      <Mark className="manifesto__mark" />

      <Reveal as="h2" mode="scrub" className="manifesto__statement display">
        {manifesto.statement}
      </Reveal>

      <div className="manifesto__body">
        {manifesto.body.map((p) => (
          <Reveal key={p} className="body-copy">
            {p}
          </Reveal>
        ))}
      </div>

      <ul className="manifesto__stats">
        {manifesto.stats.map((s) => (
          <li key={s.label}>
            <span className="manifesto__num display">
              <Counter value={s.value} decimals={s.decimals ?? 0} plain={s.plain} />
            </span>
            <span className="label">{s.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
