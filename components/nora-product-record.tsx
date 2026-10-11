type RecordItem = { label: string; value: string };
type RecordList = { title: string; items: string[] };

export function NoraProductRecord({ items, lists }: { items: RecordItem[]; lists: RecordList[] }) {
  return <section className="nora-record" id="technical-details" aria-label="NORA product record"><div className="record-heading"><div className="eyebrow">For your developer</div><h2>Everything needed to implement.</h2></div><div className="record-content"><div className="record-facts">{items.map((item) => <div key={item.label}><span>{item.label}</span><b>{item.value}</b></div>)}</div><div className="record-lists">{lists.map((list) => <article key={list.title}><h3>{list.title}</h3><ul>{list.items.map((item) => <li key={item}>{item}</li>)}</ul></article>)}</div></div></section>;
}
